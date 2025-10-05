#!/usr/bin/env python3
"""
Complete P2P System Test
Tests the full P2P synchronization system including:
- Node setup with separate databases
- Peer discovery
- Bidirectional sync
- Real-time triggers
- Conflict resolution
"""
import subprocess
import asyncio
import aiohttp
import json
import time
import logging
from datetime import datetime
import os
import signal
import sys

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class P2PSystemTester:
    def __init__(self):
        self.nodes = []
        self.node_processes = []
        
    def setup_node_configs(self):
        """Setup configuration files for each node"""
        configs = [
            {
                "node_id": "node1",
                "port": 8001,
                "db_port": 5432,
                "db_name": "product_review_node1"
            },
            {
                "node_id": "node2", 
                "port": 8002,
                "db_port": 5433,
                "db_name": "product_review_node2"
            },
            {
                "node_id": "node3",
                "port": 8003,
                "db_port": 5434, 
                "db_name": "product_review_node3"
            }
        ]
        
        for config in configs:
            env_content = f"""# Node {config['node_id']} Environment Configuration
NODE_ID={config['node_id']}
API_PORT={config['port']}
DATABASE_URL=postgresql://postgres:postgres@localhost:{config['db_port']}/{config['db_name']}

# P2P Configuration
P2P_ENABLED=true
P2P_DISCOVERY_PORT={6000 + int(config['node_id'][-1])}
P2P_PEER_PORT={config['port']}
P2P_SYNC_INTERVAL=30

# Authentication
JWT_SECRET_KEY=your-secret-key-here-{config['node_id']}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration (optional for testing)
SMTP_SERVER=localhost
SMTP_PORT=587
SMTP_USERNAME=test@example.com
SMTP_PASSWORD=testpass
FROM_EMAIL=noreply@productreview.com

# Discord Configuration (optional for testing)
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_CHANNEL_ID=your-channel-id
"""
            
            with open(f".env.{config['node_id']}", "w") as f:
                f.write(env_content)
                
            logger.info(f"Created environment config for {config['node_id']}")
    
    async def start_databases(self):
        """Start database containers using docker-compose"""
        logger.info("Starting database containers...")
        
        try:
            # Start databases
            result = subprocess.run([
                "docker-compose", "-f", "docker-compose.p2p.yml", "up", "-d", 
                "postgres1", "postgres2", "postgres3"
            ], capture_output=True, text=True, cwd=".")
            
            if result.returncode == 0:
                logger.info("✓ Database containers started successfully")
                await asyncio.sleep(10)  # Wait for databases to be ready
                return True
            else:
                logger.error(f"Failed to start databases: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error starting databases: {e}")
            return False
    
    def start_api_nodes(self):
        """Start API nodes in separate processes"""
        logger.info("Starting API nodes...")
        
        node_configs = [
            {"node_id": "node1", "port": 8001, "env_file": ".env.node1"},
            {"node_id": "node2", "port": 8002, "env_file": ".env.node2"}, 
            {"node_id": "node3", "port": 8003, "env_file": ".env.node3"}
        ]
        
        for config in node_configs:
            try:
                # Set environment variables for this node
                env = os.environ.copy()
                
                # Read env file and set variables
                if os.path.exists(config["env_file"]):
                    with open(config["env_file"], "r") as f:
                        for line in f:
                            if "=" in line and not line.startswith("#"):
                                key, value = line.strip().split("=", 1)
                                env[key] = value
                
                # Start the node
                process = subprocess.Popen([
                    sys.executable, "-m", "uvicorn", "app:app",
                    "--host", "0.0.0.0",
                    "--port", str(config["port"]),
                    "--reload"
                ], env=env, cwd=".")
                
                self.node_processes.append(process)
                logger.info(f"✓ Started {config['node_id']} on port {config['port']}")
                
            except Exception as e:
                logger.error(f"Failed to start {config['node_id']}: {e}")
        
        # Wait for nodes to start
        time.sleep(15)
        return len(self.node_processes)
    
    async def wait_for_nodes_ready(self) -> bool:
        """Wait for all nodes to be ready"""
        logger.info("Waiting for nodes to be ready...")
        
        nodes = [
            "http://localhost:8001",
            "http://localhost:8002", 
            "http://localhost:8003"
        ]
        
        max_attempts = 30
        ready_nodes = set()
        
        async with aiohttp.ClientSession() as session:
            for attempt in range(max_attempts):
                for node_url in nodes:
                    if node_url not in ready_nodes:
                        try:
                            async with session.get(f"{node_url}/docs", timeout=5) as resp:
                                if resp.status == 200:
                                    ready_nodes.add(node_url)
                                    logger.info(f"✓ Node {node_url} is ready")
                        except:
                            pass
                
                if len(ready_nodes) == len(nodes):
                    logger.info("✓ All nodes are ready!")
                    return True
                
                await asyncio.sleep(2)
        
        logger.error(f"Only {len(ready_nodes)}/{len(nodes)} nodes became ready")
        return False
    
    async def run_p2p_sync_test(self):
        """Run the P2P sync test"""
        logger.info("Running P2P sync test...")
        
        try:
            # Run the test script
            process = await asyncio.create_subprocess_exec(
                sys.executable, "test_bidirectional_p2p_sync.py",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                logger.info("✓ P2P sync test PASSED")
                logger.info(stdout.decode())
                return True
            else:
                logger.error("❌ P2P sync test FAILED")
                logger.error(stderr.decode())
                return False
                
        except Exception as e:
            logger.error(f"Error running sync test: {e}")
            return False
    
    def cleanup(self):
        """Cleanup processes and containers"""
        logger.info("Cleaning up...")
        
        # Stop API node processes
        for process in self.node_processes:
            try:
                process.terminate()
                process.wait(timeout=10)
            except:
                try:
                    process.kill()
                    process.wait(timeout=5)
                except:
                    pass
        
        # Stop database containers
        try:
            subprocess.run([
                "docker-compose", "-f", "docker-compose.p2p.yml", "down"
            ], capture_output=True, cwd=".")
            logger.info("✓ Database containers stopped")
        except:
            pass
        
        # Remove env files
        for node_id in ["node1", "node2", "node3"]:
            try:
                if os.path.exists(f".env.{node_id}"):
                    os.remove(f".env.{node_id}")
            except:
                pass
    
    async def run_full_test(self):
        """Run the complete P2P system test"""
        success = False
        
        try:
            logger.info("="*60)
            logger.info("P2P System Complete Test Starting")
            logger.info("="*60)
            
            # Setup configurations
            self.setup_node_configs()
            
            # Start databases
            if not await self.start_databases():
                return False
            
            # Start API nodes
            if self.start_api_nodes() < 3:
                logger.error("Failed to start all API nodes")
                return False
            
            # Wait for nodes to be ready
            if not await self.wait_for_nodes_ready():
                logger.error("Not all nodes became ready")
                return False
            
            # Wait a bit more for P2P discovery
            logger.info("Waiting for P2P discovery to complete...")
            await asyncio.sleep(20)
            
            # Run sync test
            success = await self.run_p2p_sync_test()
            
        except KeyboardInterrupt:
            logger.info("Test interrupted by user")
        except Exception as e:
            logger.error(f"Test failed with error: {e}")
        finally:
            self.cleanup()
        
        if success:
            logger.info("🎉 Complete P2P System Test PASSED!")
        else:
            logger.error("❌ Complete P2P System Test FAILED!")
        
        return success

async def main():
    """Main test function"""
    tester = P2PSystemTester()
    
    def signal_handler(signum, frame):
        logger.info("Received interrupt signal, cleaning up...")
        tester.cleanup()
        sys.exit(1)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    return await tester.run_full_test()

if __name__ == "__main__":
    print("Complete P2P System Test")
    print("="*50)
    print("This test will:")
    print("1. Setup separate database instances")
    print("2. Start 3 API nodes with P2P sync")
    print("3. Test bidirectional synchronization")
    print("4. Verify real-time sync triggers")
    print("5. Clean up all resources")
    print()
    print("Prerequisites:")
    print("- Docker and docker-compose installed")
    print("- Python dependencies installed")
    print("- Ports 8001-8003, 5432-5434, 6001-6003 available")
    print()
    
    success = asyncio.run(main())
    sys.exit(0 if success else 1)