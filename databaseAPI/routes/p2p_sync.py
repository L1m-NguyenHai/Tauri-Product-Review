"""
P2P Sync API Routes
Provides endpoints for peer-to-peer database synchronization
"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from typing import Dict, List, Any, Optional
import logging
import json
from datetime import datetime

from p2p_sync.config import p2p_config, PeerInfo
from p2p_sync.discovery import peer_discovery
from p2p_sync.sync_manager import data_sync_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/p2p", tags=["P2P Sync"])

# WebSocket connections for real-time sync
active_connections: List[WebSocket] = []

@router.get("/status")
async def get_p2p_status():
    """Get P2P node status and information"""
    try:
        active_peers = p2p_config.get_active_peers()
        
        return {
            "node_id": p2p_config.sync_config.node_id,
            "status": "active",
            "api_version": "1.0.1",
            "listen_port": p2p_config.sync_config.listen_port,
            "api_port": p2p_config.sync_config.api_port,
            "peer_count": len(active_peers),
            "peers": [
                {
                    "peer_id": peer.peer_id,
                    "host": peer.host,
                    "port": peer.port,
                    "status": peer.status,
                    "last_seen": peer.last_seen.isoformat()
                }
                for peer in active_peers
            ],
            "sync_config": {
                "sync_interval": p2p_config.sync_config.sync_interval,
                "sync_tables": p2p_config.sync_config.sync_tables,
                "enable_auto_discovery": p2p_config.sync_config.enable_auto_discovery,
                "enable_websocket_sync": p2p_config.sync_config.enable_websocket_sync
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting P2P status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/peers")
async def add_peer(peer_data: Dict[str, Any]):
    """Manually add a peer"""
    try:
        peer = PeerInfo(**peer_data)
        p2p_config.add_peer(peer)
        
        return {
            "message": f"Peer {peer.peer_id} added successfully",
            "peer": peer.model_dump()
        }
    except Exception as e:
        logger.error(f"Error adding peer: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/peers/{peer_id}")
async def remove_peer(peer_id: str):
    """Remove a peer"""
    try:
        p2p_config.remove_peer(peer_id)
        return {"message": f"Peer {peer_id} removed successfully"}
    except Exception as e:
        logger.error(f"Error removing peer: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/table-changes/{table}")
async def get_table_changes(table: str, since: Optional[str] = None):
    """Get table changes since specific timestamp for incremental sync"""
    try:
        if table not in p2p_config.sync_config.sync_tables:
            raise HTTPException(status_code=400, detail=f"Table {table} not configured for sync")
        
        since_datetime = None
        if since:
            try:
                since_datetime = datetime.fromisoformat(since)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid timestamp format: {e}")
        
        changes = await data_sync_manager._get_table_changes_since(table, since_datetime)
        return changes
        
    except Exception as e:
        logger.error(f"Error getting table changes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/apply-changes/{table}")
async def apply_table_changes(table: str, changes: Dict[str, Any]):
    """Apply incremental changes received from peer"""
    try:
        if table not in p2p_config.sync_config.sync_tables:
            raise HTTPException(status_code=400, detail=f"Table {table} not configured for sync")
        
        source_peer = changes.get('source_node', 'unknown')
        await data_sync_manager._apply_peer_changes(table, changes, source_peer)
        
        # Notify WebSocket clients about the changes
        await notify_sync_event({
            "type": "changes_applied",
            "table": table,
            "count": changes.get('count', 0),
            "source_peer": source_peer,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "message": f"Changes applied to table {table}",
            "rows_affected": changes.get('count', 0),
            "source_peer": source_peer
        }
        
    except Exception as e:
        logger.error(f"Error applying table changes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sync-status")
async def get_sync_status():
    """Get detailed sync status and statistics"""
    try:
        status = await data_sync_manager.get_sync_status()
        return status
    except Exception as e:
        logger.error(f"Error getting sync status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/table-data/{table}")
async def get_table_data(table: str):
    """Get complete table data for sync"""
    try:
        if table not in p2p_config.sync_config.sync_tables:
            raise HTTPException(status_code=400, detail=f"Table {table} not configured for sync")
        
        table_data = await data_sync_manager._get_table_data(table)
        return table_data
        
    except Exception as e:
        logger.error(f"Error getting table data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync-table/{table}")
async def receive_table_data(table: str, data: Dict[str, Any]):
    """Receive and apply table data from peer"""
    try:
        if table not in p2p_config.sync_config.sync_tables:
            raise HTTPException(status_code=400, detail=f"Table {table} not configured for sync")
        
        await data_sync_manager._apply_table_data(table, data)
        
        # Notify WebSocket clients about the sync
        await notify_sync_event({
            "type": "table_synced",
            "table": table,
            "count": data.get('count', 0),
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "message": f"Table {table} synced successfully",
            "rows_applied": data.get('count', 0)
        }
        
    except Exception as e:
        logger.error(f"Error receiving table data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notify-changes")
async def notify_data_changes(notification: Dict[str, Any]):
    """Receive notification from peer about data changes"""
    try:
        source_peer = notification.get('source_peer')
        tables_changed = notification.get('tables', [])
        
        if not source_peer or not tables_changed:
            raise HTTPException(status_code=400, detail="Invalid notification format")
        
        logger.info(f"Received change notification from {source_peer} for tables: {tables_changed}")
        
        # Trigger immediate sync for the specified tables with this peer
        active_peers = p2p_config.get_active_peers()
        target_peer = None
        
        for peer in active_peers:
            if peer.peer_id == source_peer:
                target_peer = peer
                break
        
        if target_peer:
            # Trigger sync in background
            import asyncio
            asyncio.create_task(data_sync_manager._sync_specific_tables_with_peer(target_peer, tables_changed))
            
            await notify_sync_event({
                "type": "change_notification_received",
                "source_peer": source_peer,
                "tables": tables_changed,
                "timestamp": datetime.now().isoformat()
            })
            
            return {
                "message": f"Change notification received from {source_peer}",
                "tables": tables_changed,
                "sync_triggered": True
            }
        else:
            return {
                "message": f"Peer {source_peer} not found in active peers",
                "sync_triggered": False
            }
            
    except Exception as e:
        logger.error(f"Error processing change notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync/bidirectional")
async def trigger_bidirectional_sync(peer_id: Optional[str] = None):
    """Trigger bidirectional sync with specific peer or all peers"""
    try:
        active_peers = p2p_config.get_active_peers()
        
        if peer_id:
            # Sync with specific peer
            target_peers = [peer for peer in active_peers if peer.peer_id == peer_id]
            if not target_peers:
                raise HTTPException(status_code=404, detail=f"Peer {peer_id} not found")
        else:
            # Sync with all peers
            target_peers = active_peers
        
        if not target_peers:
            return {"message": "No active peers to sync with"}
        
        # Trigger bidirectional sync in background
        import asyncio
        asyncio.create_task(data_sync_manager._bidirectional_sync_with_peers(target_peers))
        
        await notify_sync_event({
            "type": "bidirectional_sync_triggered",
            "peer_count": len(target_peers),
            "target_peers": [peer.peer_id for peer in target_peers],
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "message": f"Bidirectional sync triggered with {len(target_peers)} peers",
            "peers": [peer.peer_id for peer in target_peers]
        }
        
    except Exception as e:
        logger.error(f"Error triggering bidirectional sync: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/discovery/refresh")
async def refresh_peer_discovery():
    """Refresh peer discovery"""
    try:
        await peer_discovery._broadcast_presence()
        return {"message": "Peer discovery refreshed"}
    except Exception as e:
        logger.error(f"Error refreshing discovery: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time P2P sync notifications"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        # Send initial status
        status = await get_p2p_status()
        await websocket.send_text(json.dumps({
            "type": "status",
            "data": status
        }))
        
        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                }))
            elif message.get("type") == "request_status":
                status = await get_p2p_status()
                await websocket.send_text(json.dumps({
                    "type": "status",
                    "data": status
                }))
                
    except WebSocketDisconnect:
        active_connections.remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)

async def notify_sync_event(event: Dict[str, Any]):
    """Notify all WebSocket clients about sync events"""
    if active_connections:
        message = json.dumps({
            "type": "sync_event",
            "data": event
        })
        
        # Send to all connected clients
        disconnected = []
        for connection in active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            active_connections.remove(conn)

@router.get("/config")
async def get_p2p_config():
    """Get current P2P configuration"""
    return {
        "node_id": p2p_config.sync_config.node_id,
        "config": p2p_config.sync_config.model_dump()
    }

@router.post("/config")
async def update_p2p_config(config_data: Dict[str, Any]):
    """Update P2P configuration"""
    try:
        # Update specific config fields
        current_config = p2p_config.sync_config.model_dump()
        current_config.update(config_data)
        
        from ..p2p_sync.config import SyncConfig
        new_config = SyncConfig(**current_config)
        p2p_config.save_config(new_config)
        
        return {
            "message": "Configuration updated successfully",
            "config": new_config.model_dump()
        }
    except Exception as e:
        logger.error(f"Error updating config: {e}")
        raise HTTPException(status_code=400, detail=str(e))