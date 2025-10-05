"""
Peer Discovery Service
Handles automatic discovery of other P2P nodes in the network
"""
import asyncio
import socket
import json
import logging
from datetime import datetime, timedelta
from typing import Set, Dict
import aiohttp
from .config import p2p_config, PeerInfo

logger = logging.getLogger(__name__)

class PeerDiscovery:
    """Handles peer discovery and network communication"""
    
    def __init__(self):
        self.discovery_socket = None
        self.running = False
        self.discovered_peers: Set[str] = set()
        
    async def start_discovery(self):
        """Start peer discovery service"""
        if not p2p_config.sync_config.enable_auto_discovery:
            logger.info("Auto discovery disabled")
            return
            
        self.running = True
        
        # Start UDP broadcast listener
        asyncio.create_task(self._start_udp_listener())
        
        # Start periodic broadcast
        asyncio.create_task(self._start_periodic_broadcast())
        
        # Start peer health check
        asyncio.create_task(self._start_health_check())
        
        logger.info(f"Peer discovery started on port {p2p_config.sync_config.discovery_port}")
    
    async def stop_discovery(self):
        """Stop discovery service"""
        self.running = False
        if self.discovery_socket:
            self.discovery_socket.close()
        logger.info("Peer discovery stopped")
    
    async def _start_udp_listener(self):
        """Listen for peer announcements via UDP broadcast"""
        try:
            self.discovery_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.discovery_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.discovery_socket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            self.discovery_socket.bind(('', p2p_config.sync_config.discovery_port))
            self.discovery_socket.setblocking(False)
            
            while self.running:
                try:
                    data, addr = await asyncio.get_event_loop().sock_recvfrom(self.discovery_socket, 1024)
                    await self._handle_peer_announcement(data, addr)
                except Exception as e:
                    if self.running:
                        logger.error(f"UDP listener error: {e}")
                    await asyncio.sleep(1)
                    
        except Exception as e:
            logger.error(f"Failed to start UDP listener: {e}")
    
    async def _handle_peer_announcement(self, data: bytes, addr: tuple):
        """Handle incoming peer announcements"""
        try:
            message = json.loads(data.decode())
            
            if message.get('type') == 'peer_announcement':
                peer_data = message.get('peer')
                if peer_data and peer_data['peer_id'] != p2p_config.sync_config.node_id:
                    peer = PeerInfo(**peer_data)
                    await self._verify_and_add_peer(peer)
                    
        except Exception as e:
            logger.error(f"Error handling peer announcement: {e}")
    
    async def _verify_and_add_peer(self, peer: PeerInfo):
        """Verify peer is reachable and add to peer list"""
        try:
            # Test connection to peer API
            # Support both HTTP and HTTPS (for ngrok)
            protocol = "https" if peer.port == 443 else "http"
            
            connector = aiohttp.TCPConnector(ssl=False) if protocol == "https" else None
            
            async with aiohttp.ClientSession(connector=connector) as session:
                url = f"{protocol}://{peer.host}:{peer.port}/api/v1/p2p/status"
                if peer.port == 443:
                    # For ngrok, don't include port in URL
                    url = f"https://{peer.host}/api/v1/p2p/status"
                    
                async with session.get(url, timeout=10) as response:
                    if response.status == 200:
                        p2p_config.add_peer(peer)
                        self.discovered_peers.add(peer.peer_id)
                        logger.info(f"Verified and added peer: {peer.peer_id}")
                    
        except Exception as e:
            logger.debug(f"Failed to verify peer {peer.peer_id}: {e}")
    
    async def _start_periodic_broadcast(self):
        """Broadcast our presence periodically"""
        while self.running:
            try:
                await self._broadcast_presence()
                await asyncio.sleep(p2p_config.sync_config.sync_interval)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                await asyncio.sleep(5)
    
    async def _broadcast_presence(self):
        """Broadcast our presence to network"""
        try:
            message = {
                'type': 'peer_announcement',
                'peer': {
                    'peer_id': p2p_config.sync_config.node_id,
                    'host': self._get_local_ip(),
                    'port': p2p_config.sync_config.api_port,
                    'last_seen': datetime.now().isoformat(),
                    'api_version': p2p_config.sync_config.sync_config.api_version if hasattr(p2p_config.sync_config, 'api_version') else "1.0.1",
                    'status': 'active'
                }
            }
            
            # Broadcast to network
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            
            data = json.dumps(message).encode()
            sock.sendto(data, ('255.255.255.255', p2p_config.sync_config.discovery_port))
            sock.close()
            
            logger.debug("Broadcasted presence to network")
            
        except Exception as e:
            logger.error(f"Failed to broadcast presence: {e}")
    
    def _get_local_ip(self) -> str:
        """Get local IP address"""
        try:
            # Connect to a remote address to determine local IP
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                return s.getsockname()[0]
        except:
            return "127.0.0.1"
    
    async def _start_health_check(self):
        """Periodically check peer health"""
        while self.running:
            try:
                await self._check_peer_health()
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Health check error: {e}")
                await asyncio.sleep(10)
    
    async def _check_peer_health(self):
        """Check health of all peers"""
        current_time = datetime.now()
        inactive_peers = []
        
        for peer_id, peer in p2p_config.peers.items():
            try:
                # Check if peer is responsive
                protocol = "https" if peer.port == 443 else "http"
                connector = aiohttp.TCPConnector(ssl=False) if protocol == "https" else None
                
                async with aiohttp.ClientSession(connector=connector) as session:
                    url = f"{protocol}://{peer.host}:{peer.port}/api/v1/p2p/status"
                    if peer.port == 443:
                        # For ngrok, don't include port in URL
                        url = f"https://{peer.host}/api/v1/p2p/status"
                        
                    async with session.get(url, timeout=10) as response:
                        if response.status == 200:
                            p2p_config.update_peer_status(peer_id, "active")
                        else:
                            p2p_config.update_peer_status(peer_id, "inactive")
                            
            except Exception:
                # Mark as inactive if unreachable for more than 2 minutes
                if current_time - peer.last_seen > timedelta(minutes=2):
                    inactive_peers.append(peer_id)
        
        # Remove inactive peers
        for peer_id in inactive_peers:
            p2p_config.remove_peer(peer_id)
            if peer_id in self.discovered_peers:
                self.discovered_peers.remove(peer_id)

# Global discovery instance
peer_discovery = PeerDiscovery()