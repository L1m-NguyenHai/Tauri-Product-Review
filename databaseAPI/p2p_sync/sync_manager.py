"""
Data Synchronization Manager
Handles database synchronization between separate peer databases via API
"""
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import aiohttp
import hashlib
from database.connection import get_pool
from .config import p2p_config, PeerInfo

logger = logging.getLogger(__name__)

class DataSyncManager:
    """Manages data synchronization between separate peer databases"""
    
    def __init__(self):
        self.sync_lock = asyncio.Lock()
        self.last_sync_times: Dict[str, Dict[str, datetime]] = {}  # {peer_id: {table: last_sync_time}}
        self.sync_running = False
        self.sync_status: Dict[str, Any] = {}
        
    async def start_sync_service(self):
        """Start the synchronization service"""
        self.sync_running = True
        asyncio.create_task(self._periodic_sync())
        logger.info("Data sync service started for separate databases")
    
    async def stop_sync_service(self):
        """Stop the synchronization service"""
        self.sync_running = False
        logger.info("Data sync service stopped")
    
    async def _periodic_sync(self):
        """Periodically sync with all peers"""
        while self.sync_running:
            try:
                active_peers = p2p_config.get_active_peers()
                if active_peers:
                    await self._sync_with_peers(active_peers)
                
                await asyncio.sleep(p2p_config.sync_config.sync_interval)
            except Exception as e:
                logger.error(f"Periodic sync error: {e}")
                await asyncio.sleep(10)
    
    async def _sync_with_peers(self, peers: List[PeerInfo]):
        """Sync data with multiple peers - incremental approach"""
        async with self.sync_lock:
            self.sync_status = {
                "start_time": datetime.now().isoformat(),
                "peers": len(peers),
                "tables_synced": 0,
                "conflicts_resolved": 0,
                "errors": []
            }
            
            for peer in peers:
                try:
                    await self._sync_with_peer(peer)
                except Exception as e:
                    error_msg = f"Error syncing with peer {peer.peer_id}: {e}"
                    logger.error(error_msg)
                    self.sync_status["errors"].append(error_msg)
                    
            self.sync_status["end_time"] = datetime.now().isoformat()
    
    async def _sync_with_peer(self, peer: PeerInfo):
        """Sync data with a specific peer using bidirectional incremental approach"""
        logger.info(f"Starting bidirectional sync with peer {peer.peer_id}")
        
        peer_id = peer.peer_id
        if peer_id not in self.last_sync_times:
            self.last_sync_times[peer_id] = {}
        
        for table in p2p_config.sync_config.sync_tables:
            try:
                await self._bidirectional_sync_table(peer, table)
                self.sync_status["tables_synced"] += 1
            except Exception as e:
                error_msg = f"Error syncing table {table} with peer {peer.peer_id}: {e}"
                logger.error(error_msg)
                self.sync_status["errors"].append(error_msg)
    
    async def _bidirectional_sync_table(self, peer: PeerInfo, table: str):
        """Perform bidirectional sync for a specific table"""
        peer_id = peer.peer_id
        last_sync = self.last_sync_times[peer_id].get(table)
        
        # Get changes from both sides since last sync
        our_changes = await self._get_table_changes_since(table, last_sync)
        peer_changes = await self._get_peer_table_changes_since(peer, table, last_sync)
        
        # Send our changes to peer (if any)
        if our_changes["data"]:
            await self._send_changes_to_peer(peer, table, our_changes)
            logger.info(f"Sent {len(our_changes['data'])} changes to peer {peer_id} for table {table}")
            
        # Apply peer changes to our database (if any)
        if peer_changes["data"]:
            await self._apply_peer_changes(table, peer_changes, peer_id)
            logger.info(f"Applied {len(peer_changes['data'])} changes from peer {peer_id} for table {table}")
        
        # Update last sync time only if both operations succeeded
        current_time = datetime.now()
        self.last_sync_times[peer_id][table] = current_time
        
        # Log sync summary
        if our_changes["data"] or peer_changes["data"]:
            logger.info(f"Bidirectional sync completed for {table} with {peer_id}: "
                       f"sent {len(our_changes['data'])}, received {len(peer_changes['data'])} changes")
        else:
            logger.debug(f"No changes to sync for {table} with {peer_id}")
    
    async def _get_table_changes_since(self, table: str, since: Optional[datetime]) -> Dict[str, Any]:
        """Get table changes since a specific timestamp"""
        pool = get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                
                # If no since time, get all data (initial sync)
                if since is None:
                    return await self._get_full_table_data(table)
                
                # Get incremental changes based on table
                if table == "users":
                    await cursor.execute("""
                        SELECT id, username, email, full_name, avatar_url, 
                               bio, created_at, updated_at, is_active, is_verified, role,
                               'UPDATE' as change_type
                        FROM users 
                        WHERE updated_at > %s
                        ORDER BY updated_at
                    """, (since,))
                    columns = ['id', 'username', 'email', 'full_name', 'avatar_url', 
                              'bio', 'created_at', 'updated_at', 'is_active', 'is_verified', 'role', 'change_type']
                              
                elif table == "products":
                    await cursor.execute("""
                        SELECT id, name, description, category_id, manufacturer, 
                               price, created_at, updated_at, is_active,
                               'UPDATE' as change_type
                        FROM products 
                        WHERE updated_at > %s
                        ORDER BY updated_at
                    """, (since,))
                    columns = ['id', 'name', 'description', 'category_id', 'manufacturer', 
                              'price', 'created_at', 'updated_at', 'is_active', 'change_type']
                              
                elif table == "reviews":
                    await cursor.execute("""
                        SELECT id, user_id, product_id, rating, title, content,
                               pros, cons, verified_purchase, created_at, updated_at,
                               'UPDATE' as change_type
                        FROM reviews 
                        WHERE updated_at > %s
                        ORDER BY updated_at
                    """, (since,))
                    columns = ['id', 'user_id', 'product_id', 'rating', 'title', 'content',
                              'pros', 'cons', 'verified_purchase', 'created_at', 'updated_at', 'change_type']
                              
                elif table == "categories":
                    await cursor.execute("""
                        SELECT id, name, description, parent_id, created_at, updated_at,
                               'UPDATE' as change_type
                        FROM categories 
                        WHERE updated_at > %s
                        ORDER BY updated_at
                    """, (since,))
                    columns = ['id', 'name', 'description', 'parent_id', 'created_at', 'updated_at', 'change_type']
                else:
                    # Generic handling for other tables
                    await cursor.execute(f"""
                        SELECT *, 'UPDATE' as change_type
                        FROM {table} 
                        WHERE updated_at > %s OR created_at > %s
                        ORDER BY COALESCE(updated_at, created_at)
                    """, (since, since))
                    columns = [desc[0] for desc in cursor.description]
                
                rows = await cursor.fetchall()
                
                # Convert to list of dictionaries
                changes = []
                for row in rows:
                    row_dict = {}
                    for i, value in enumerate(row):
                        if isinstance(value, datetime):
                            row_dict[columns[i]] = value.isoformat()
                        else:
                            row_dict[columns[i]] = value
                    changes.append(row_dict)
                
                return {
                    'table': table,
                    'data': changes,
                    'timestamp': datetime.now().isoformat(),
                    'count': len(changes),
                    'since': since.isoformat() if since else None,
                    'sync_type': 'incremental' if since else 'full'
                }
    
    async def _get_peer_table_changes_since(self, peer: PeerInfo, table: str, since: Optional[datetime]) -> Dict[str, Any]:
        """Get table changes from peer since specific timestamp"""
        try:
            since_param = since.isoformat() if since else None
            
            # Support both HTTP and HTTPS (for ngrok)
            protocol = "https" if peer.port == 443 else "http"
            connector = aiohttp.TCPConnector(ssl=False) if protocol == "https" else None
            
            async with aiohttp.ClientSession(connector=connector) as session:
                url = f"{protocol}://{peer.host}:{peer.port}/api/v1/p2p/table-changes/{table}"
                if peer.port == 443:
                    # For ngrok, don't include port in URL
                    url = f"https://{peer.host}/api/v1/p2p/table-changes/{table}"
                    
                params = {"since": since_param} if since_param else {}
                
                async with session.get(url, params=params, timeout=60) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.error(f"Failed to get changes from peer: HTTP {response.status}")
                        return {"table": table, "data": [], "count": 0}
                        
        except Exception as e:
            logger.error(f"Error getting changes from peer: {e}")
            return {"table": table, "data": [], "count": 0}
    
    async def _send_changes_to_peer(self, peer: PeerInfo, table: str, changes: Dict[str, Any]):
        """Send our changes to peer"""
        try:
            # Support both HTTP and HTTPS (for ngrok)
            protocol = "https" if peer.port == 443 else "http"
            connector = aiohttp.TCPConnector(ssl=False) if protocol == "https" else None
            
            async with aiohttp.ClientSession(connector=connector) as session:
                url = f"{protocol}://{peer.host}:{peer.port}/api/v1/p2p/apply-changes/{table}"
                if peer.port == 443:
                    # For ngrok, don't include port in URL
                    url = f"https://{peer.host}/api/v1/p2p/apply-changes/{table}"
                
                # Add metadata
                payload = {
                    **changes,
                    "source_node": p2p_config.sync_config.node_id,
                    "sync_timestamp": datetime.now().isoformat()
                }
                
                async with session.post(url, json=payload, timeout=120) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"Successfully sent {len(changes['data'])} changes to peer {peer.peer_id} for table {table}")
                        return result
                    else:
                        error_text = await response.text()
                        logger.error(f"Failed to send changes to peer: HTTP {response.status} - {error_text}")
                        
        except Exception as e:
            logger.error(f"Error sending changes to peer: {e}")
    
    async def _apply_peer_changes(self, table: str, changes: Dict[str, Any], source_peer: str):
        """Apply changes received from peer with conflict resolution"""
        if not changes.get("data"):
            return
            
        pool = get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                try:
                    await cursor.execute("BEGIN")
                    
                    applied_count = 0
                    conflict_count = 0
                    
                    for change in changes["data"]:
                        try:
                            conflict_resolved = await self._apply_single_change(cursor, table, change, source_peer)
                            if conflict_resolved:
                                conflict_count += 1
                            applied_count += 1
                            
                        except Exception as e:
                            logger.error(f"Error applying change for {table}: {e}")
                            # Continue with other changes
                    
                    await cursor.execute("COMMIT")
                    
                    self.sync_status["conflicts_resolved"] += conflict_count
                    logger.info(f"Applied {applied_count} changes to {table}, resolved {conflict_count} conflicts")
                    
                except Exception as e:
                    await cursor.execute("ROLLBACK")
                    logger.error(f"Error applying changes to {table}: {e}")
                    raise
    
    async def _apply_single_change(self, cursor, table: str, change: Dict[str, Any], source_peer: str) -> bool:
        """Apply a single change with conflict detection and resolution"""
        change_type = change.get('change_type', 'UPDATE')
        record_id = change.get('id')
        
        if not record_id:
            logger.error(f"Change missing ID for table {table}")
            return False
        
        # Check if record exists
        await cursor.execute(f"SELECT updated_at FROM {table} WHERE id = %s", (record_id,))
        existing = await cursor.fetchone()
        
        if existing:
            existing_updated_at = existing[0]
            change_updated_at = datetime.fromisoformat(change.get('updated_at', datetime.now().isoformat()))
            
            # Conflict detection
            if existing_updated_at >= change_updated_at:
                logger.debug(f"Conflict detected for {table}.{record_id}: local is newer or same")
                
                # Simple conflict resolution: choose the one with "higher" node_id
                our_node_id = p2p_config.sync_config.node_id
                if our_node_id > source_peer:
                    logger.debug(f"Keeping local version for {table}.{record_id}")
                    return True  # Conflict resolved by keeping local
            
            # Update existing record
            await self._update_record(cursor, table, change)
        else:
            # Insert new record
            await self._insert_record(cursor, table, change)
        
        return False  # No conflict
    
    async def _update_record(self, cursor, table: str, change: Dict[str, Any]):
        """Update existing record"""
        # Remove metadata fields
        data = {k: v for k, v in change.items() 
                if k not in ['change_type', 'source_node', 'sync_timestamp']}
        
        # Convert ISO timestamps back to datetime objects
        for key, value in data.items():
            if key.endswith('_at') and isinstance(value, str):
                try:
                    data[key] = datetime.fromisoformat(value)
                except:
                    pass
        
        # Build update query
        set_clause = ', '.join([f"{k} = %s" for k in data.keys() if k != 'id'])
        values = [v for k, v in data.items() if k != 'id'] + [data['id']]
        
        query = f"UPDATE {table} SET {set_clause} WHERE id = %s"
        await cursor.execute(query, values)
    
    async def _insert_record(self, cursor, table: str, change: Dict[str, Any]):
        """Insert new record"""
        # Remove metadata fields
        data = {k: v for k, v in change.items() 
                if k not in ['change_type', 'source_node', 'sync_timestamp']}
        
        # Convert ISO timestamps back to datetime objects
        for key, value in data.items():
            if key.endswith('_at') and isinstance(value, str):
                try:
                    data[key] = datetime.fromisoformat(value)
                except:
                    pass
        
        # Build insert query
        columns = list(data.keys())
        placeholders = ', '.join(['%s'] * len(columns))
        columns_str = ', '.join(columns)
        values = list(data.values())
        
        query = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders}) ON CONFLICT (id) DO NOTHING"
        await cursor.execute(query, values)
    
    async def _get_full_table_data(self, table: str) -> Dict[str, Any]:
        """Get complete table data for initial sync"""
        pool = get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                if table == "users":
                    await cursor.execute("""
                        SELECT id, username, email, full_name, avatar_url, 
                               bio, created_at, updated_at, is_active, is_verified, role
                        FROM users ORDER BY id
                    """)
                    columns = ['id', 'username', 'email', 'full_name', 'avatar_url', 
                              'bio', 'created_at', 'updated_at', 'is_active', 'is_verified', 'role']
                elif table == "products":
                    await cursor.execute("""
                        SELECT id, name, description, category_id, manufacturer, 
                               price, created_at, updated_at, is_active
                        FROM products ORDER BY id
                    """)
                    columns = ['id', 'name', 'description', 'category_id', 'manufacturer', 
                              'price', 'created_at', 'updated_at', 'is_active']
                elif table == "reviews":
                    await cursor.execute("""
                        SELECT id, user_id, product_id, rating, title, content,
                               pros, cons, verified_purchase, created_at, updated_at
                        FROM reviews ORDER BY id
                    """)
                    columns = ['id', 'user_id', 'product_id', 'rating', 'title', 'content',
                              'pros', 'cons', 'verified_purchase', 'created_at', 'updated_at']
                elif table == "categories":
                    await cursor.execute("""
                        SELECT id, name, description, parent_id, created_at, updated_at
                        FROM categories ORDER BY id
                    """)
                    columns = ['id', 'name', 'description', 'parent_id', 'created_at', 'updated_at']
                else:
                    # Generic table handling
                    await cursor.execute(f"SELECT * FROM {table} ORDER BY id")
                    columns = [desc[0] for desc in cursor.description]
                
                rows = await cursor.fetchall()
                
                # Convert to list of dictionaries
                data = []
                for row in rows:
                    row_dict = {}
                    for i, value in enumerate(row):
                        if isinstance(value, datetime):
                            row_dict[columns[i]] = value.isoformat()
                        else:
                            row_dict[columns[i]] = value
                    data.append(row_dict)
                
                return {
                    'table': table,
                    'data': data,
                    'timestamp': datetime.now().isoformat(),
                    'count': len(data),
                    'sync_type': 'full'
                }

    async def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status"""
        return {
            "sync_running": self.sync_running,
            "last_sync_status": self.sync_status,
            "peer_sync_times": {
                peer_id: {table: time.isoformat() for table, time in tables.items()}
                for peer_id, tables in self.last_sync_times.items()
            },
            "active_peers": len(p2p_config.get_active_peers())
        }
    
    async def _bidirectional_sync_with_peers(self, peers: List[PeerInfo]):
        """Perform bidirectional sync with multiple peers"""
        async with self.sync_lock:
            self.sync_status = {
                "start_time": datetime.now().isoformat(),
                "peers": len(peers),
                "tables_synced": 0,
                "conflicts_resolved": 0,
                "errors": [],
                "sync_type": "bidirectional"
            }
            
            for peer in peers:
                try:
                    await self._sync_with_peer(peer)
                except Exception as e:
                    error_msg = f"Error in bidirectional sync with peer {peer.peer_id}: {e}"
                    logger.error(error_msg)
                    self.sync_status["errors"].append(error_msg)
                    
            self.sync_status["end_time"] = datetime.now().isoformat()
    
    async def _sync_specific_tables_with_peer(self, peer: PeerInfo, tables: List[str]):
        """Sync specific tables with a peer"""
        logger.info(f"Syncing specific tables {tables} with peer {peer.peer_id}")
        
        peer_id = peer.peer_id
        if peer_id not in self.last_sync_times:
            self.last_sync_times[peer_id] = {}
        
        for table in tables:
            if table in p2p_config.sync_config.sync_tables:
                try:
                    await self._bidirectional_sync_table(peer, table)
                    logger.info(f"Completed sync for table {table} with peer {peer_id}")
                except Exception as e:
                    logger.error(f"Error syncing table {table} with peer {peer_id}: {e}")
    
    async def notify_peers_of_changes(self, tables: List[str]):
        """Notify all peers about data changes in specific tables"""
        active_peers = p2p_config.get_active_peers()
        
        if not active_peers:
            logger.debug("No active peers to notify")
            return
        
        notification = {
            "source_peer": p2p_config.sync_config.node_id,
            "tables": tables,
            "timestamp": datetime.now().isoformat(),
            "notification_type": "data_changed"
        }
        
        for peer in active_peers:
            try:
                await self._send_notification_to_peer(peer, notification)
            except Exception as e:
                logger.error(f"Failed to notify peer {peer.peer_id}: {e}")
    
    async def _send_notification_to_peer(self, peer: PeerInfo, notification: Dict[str, Any]):
        """Send notification to a specific peer"""
        try:
            # Support both HTTP and HTTPS (for ngrok)
            protocol = "https" if peer.port == 443 else "http"
            connector = aiohttp.TCPConnector(ssl=False) if protocol == "https" else None
            
            async with aiohttp.ClientSession(connector=connector) as session:
                url = f"{protocol}://{peer.host}:{peer.port}/api/v1/p2p/notify-changes"
                if peer.port == 443:
                    # For ngrok, don't include port in URL
                    url = f"https://{peer.host}/api/v1/p2p/notify-changes"
                
                async with session.post(url, json=notification, timeout=30) as response:
                    if response.status == 200:
                        logger.debug(f"Successfully notified peer {peer.peer_id}")
                    else:
                        logger.warning(f"Failed to notify peer {peer.peer_id}: HTTP {response.status}")
                        
        except Exception as e:
            logger.error(f"Error sending notification to peer {peer.peer_id}: {e}")
    
    async def trigger_sync_after_data_change(self, table: str):
        """Trigger sync after local data changes"""
        try:
            # Notify all peers about the change
            await self.notify_peers_of_changes([table])
            
            # Optionally trigger immediate sync (can be disabled for performance)
            if p2p_config.sync_config.sync_interval < 60:  # Only for frequent sync intervals
                active_peers = p2p_config.get_active_peers()
                if active_peers:
                    # Trigger sync in background without blocking
                    import asyncio
                    asyncio.create_task(self._sync_specific_tables_with_peers(active_peers, [table]))
                    
        except Exception as e:
            logger.error(f"Error triggering sync after data change: {e}")
    
    async def _sync_specific_tables_with_peers(self, peers: List[PeerInfo], tables: List[str]):
        """Sync specific tables with multiple peers"""
        for peer in peers:
            try:
                await self._sync_specific_tables_with_peer(peer, tables)
            except Exception as e:
                logger.error(f"Error syncing tables {tables} with peer {peer.peer_id}: {e}")
    
    async def trigger_sync_after_data_change(self, table_name: str):
        """Trigger immediate sync after data changes in a table"""
        try:
            active_peers = p2p_config.get_active_peers()
            if not active_peers:
                logger.debug(f"No active peers to sync table {table_name}")
                return
            
            logger.info(f"Triggering immediate sync for table {table_name} with {len(active_peers)} peers")
            
            # Perform async sync without blocking the request
            asyncio.create_task(self._sync_specific_tables_with_peers(active_peers, [table_name]))
            
        except Exception as e:
            logger.error(f"Error triggering sync for table {table_name}: {e}")

# Global sync manager instance
data_sync_manager = DataSyncManager()