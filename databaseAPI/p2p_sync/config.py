"""
P2P Sync Configuration
Handles peer discovery and network configuration
"""
import os
import json
import logging
from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime

logger = logging.getLogger(__name__)

class PeerInfo(BaseModel):
    """Information about a peer node"""
    peer_id: str
    host: str
    port: int
    last_seen: datetime
    api_version: str = "1.0.1"
    status: str = "active"  # active, inactive, syncing
    
class SyncConfig(BaseModel):
    """P2P Sync configuration"""
    node_id: str
    listen_port: int = 8001
    api_port: int = 8000
    discovery_port: int = 8002
    sync_interval: int = 30  # seconds
    max_peers: int = 10
    enable_auto_discovery: bool = True
    enable_websocket_sync: bool = True
    sync_tables: List[str] = [
        "users", "products", "reviews", "categories", 
        "product_images", "review_media", "activity_logs"
    ]

class P2PConfig:
    """P2P Configuration Manager"""
    
    def __init__(self):
        self.config_file = "p2p_config.json"
        self.peers: Dict[str, PeerInfo] = {}
        self.sync_config = self._load_config()
        
    def _load_config(self) -> SyncConfig:
        """Load configuration from file or create default"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    data = json.load(f)
                    return SyncConfig(**data)
            except Exception as e:
                logger.error(f"Error loading config: {e}")
        
        # Create default config
        import uuid
        default_config = SyncConfig(
            node_id=str(uuid.uuid4()),
            listen_port=int(os.getenv("P2P_PORT", 8001)),
            api_port=int(os.getenv("API_PORT", 8000))
        )
        self.save_config(default_config)
        return default_config
    
    def save_config(self, config: SyncConfig):
        """Save configuration to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(config.model_dump(), f, indent=2, default=str)
            self.sync_config = config
            logger.info(f"Config saved with node_id: {config.node_id}")
        except Exception as e:
            logger.error(f"Error saving config: {e}")
    
    def add_peer(self, peer: PeerInfo):
        """Add or update peer information"""
        self.peers[peer.peer_id] = peer
        logger.info(f"Added peer: {peer.peer_id} at {peer.host}:{peer.port}")
    
    def remove_peer(self, peer_id: str):
        """Remove peer"""
        if peer_id in self.peers:
            del self.peers[peer_id]
            logger.info(f"Removed peer: {peer_id}")
    
    def get_active_peers(self) -> List[PeerInfo]:
        """Get list of active peers"""
        return [peer for peer in self.peers.values() if peer.status == "active"]
    
    def update_peer_status(self, peer_id: str, status: str):
        """Update peer status"""
        if peer_id in self.peers:
            self.peers[peer_id].status = status
            self.peers[peer_id].last_seen = datetime.now()

# Global config instance
p2p_config = P2PConfig()