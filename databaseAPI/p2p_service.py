#!/usr/bin/env python3
"""
P2P Sync Standalone Service
Can be run separately from the main API if needed
"""
import asyncio
import logging
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from p2p_sync.config import p2p_config, SyncConfig
from p2p_sync.discovery import peer_discovery
from p2p_sync.sync_manager import data_sync_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class P2PService:
    """Standalone P2P Service"""
    
    def __init__(self):
        self.running = False
    
    async def start(self):
        """Start P2P service"""
        logger.info("Starting P2P Sync Service...")
        
        try:
            # Initialize database connection
            from database.connection import init_pool
            init_pool()
            logger.info("Database connection initialized")
            
            # Start services
            await peer_discovery.start_discovery()
            await data_sync_manager.start_sync_service()
            
            self.running = True
            logger.info(f"P2P Service started successfully on node: {p2p_config.sync_config.node_id}")
            logger.info(f"Discovery port: {p2p_config.sync_config.discovery_port}")
            logger.info(f"API port: {p2p_config.sync_config.api_port}")
            
            # Keep service running
            while self.running:
                await asyncio.sleep(1)
                
        except KeyboardInterrupt:
            logger.info("Received shutdown signal")
        except Exception as e:
            logger.error(f"Service error: {e}")
        finally:
            await self.stop()
    
    async def stop(self):
        """Stop P2P service"""
        logger.info("Stopping P2P Sync Service...")
        self.running = False
        
        try:
            await peer_discovery.stop_discovery()
            await data_sync_manager.stop_sync_service()
            
            from database.connection import close_pool
            close_pool()
            
            logger.info("P2P Service stopped successfully")
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")

async def main():
    """Main function"""
    service = P2PService()
    await service.start()

if __name__ == "__main__":
    asyncio.run(main())