#!/usr/bin/env python3
"""
Remote P2P Sync Test Script
Tests P2P synchronization between local and remote nodes via ngrok
"""
import asyncio
import aiohttp
import json
import time
import os
from datetime import datetime

class RemoteP2PTest:
    def __init__(self):
        # Local node (always localhost)
        self.local_node = {
            "name": "Local",
            "url": "http://localhost:8000"
        }
        
        # Remote node (via ngrok - set via environment variable)
        remote_url = os.getenv("REMOTE_P2P_URL", "https://example.ngrok.io")
        self.remote_node = {
            "name": "Remote",
            "url": remote_url
        }
        
        self.nodes = [self.local_node, self.remote_node]
        
        print(f"🌐 Testing P2P sync between:")
        print(f"   Local:  {self.local_node['url']}")
        print(f"   Remote: {self.remote_node['url']}")
        print()
    
    async def test_connectivity(self):
        """Test basic connectivity to both nodes"""
        print("🔗 Testing connectivity...")
        
        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=False),
            timeout=aiohttp.ClientTimeout(total=30)
        ) as session:
            for node in self.nodes:
                try:
                    url = f"{node['url']}/health"
                    async with session.get(url) as response:
                        if response.status == 200:
                            print(f"✅ {node['name']}: Connected")
                        else:
                            print(f"❌ {node['name']}: HTTP {response.status}")
                except Exception as e:
                    print(f"❌ {node['name']}: {e}")
        print()
    
    async def test_p2p_status(self):
        """Test P2P status on both nodes"""
        print("📊 Testing P2P status...")
        
        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=False),
            timeout=aiohttp.ClientTimeout(total=30)
        ) as session:
            for node in self.nodes:
                try:
                    url = f"{node['url']}/api/v1/p2p/status"
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            print(f"✅ {node['name']}:")
                            print(f"   Node ID: {data['node_id'][:8]}...")
                            print(f"   Peers: {data['peer_count']}")
                            print(f"   Status: {data['status']}")
                        else:
                            print(f"❌ {node['name']}: HTTP {response.status}")
                except Exception as e:
                    print(f"❌ {node['name']}: {e}")
        print()
    
    async def setup_peer_connection(self):
        """Setup manual peer connection between local and remote"""
        print("🤝 Setting up peer connections...")
        
        # Get node IDs first
        node_ids = {}
        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=False)
        ) as session:
            for node in self.nodes:
                try:
                    url = f"{node['url']}/api/v1/p2p/status"
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            node_ids[node['name']] = data['node_id']
                        else:
                            print(f"❌ Failed to get {node['name']} node ID")
                            return False
                except Exception as e:
                    print(f"❌ Error getting {node['name']} node ID: {e}")
                    return False
        
        # Add remote peer to local node
        try:
            from urllib.parse import urlparse
            remote_parsed = urlparse(self.remote_node['url'])
            
            peer_data = {
                "peer_id": node_ids['Remote'],
                "host": remote_parsed.hostname,
                "port": 443 if remote_parsed.scheme == 'https' else (remote_parsed.port or 80),
                "last_seen": datetime.now().isoformat(),
                "api_version": "1.0.1",
                "status": "active"
            }
            
            async with aiohttp.ClientSession() as session:
                url = f"{self.local_node['url']}/api/v1/p2p/peers"
                async with session.post(url, json=peer_data) as response:
                    if response.status == 200:
                        print("✅ Added remote peer to local node")
                    else:
                        error = await response.text()
                        print(f"❌ Failed to add remote peer: {error}")
                        
        except Exception as e:
            print(f"❌ Error setting up peer connection: {e}")
            return False
        
        # Add local peer to remote node (if possible)
        # Note: This might not work if local is behind NAT
        print("ℹ️  Local to remote peer connection setup skipped (NAT/firewall)")
        print()
        return True
    
    async def test_data_creation_and_sync(self):
        """Test creating data and syncing between nodes"""
        print("📝 Testing data creation and sync...")
        
        # Create test user on local node
        test_user = {
            "username": f"remote_test_{int(time.time())}",
            "email": f"remote_test_{int(time.time())}@example.com",
            "password": "password123",
            "full_name": "Remote Test User"
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                # Create user on local
                url = f"{self.local_node['url']}/api/v1/auth/register"
                async with session.post(url, json=test_user) as response:
                    if response.status == 201:
                        print(f"✅ Created test user on local: {test_user['username']}")
                    else:
                        error = await response.text()
                        print(f"❌ Failed to create user: {error}")
                        return
                        
            except Exception as e:
                print(f"❌ Error creating test user: {e}")
                return
        
        # Trigger sync
        await self.trigger_sync()
        
        # Wait for sync
        print("⏳ Waiting 15 seconds for sync...")
        await asyncio.sleep(15)
        
        # Check if user exists on remote
        await self.verify_user_sync(test_user['username'])
    
    async def trigger_sync(self):
        """Trigger manual sync on local node"""
        print("🔄 Triggering manual sync...")
        
        async with aiohttp.ClientSession() as session:
            try:
                url = f"{self.local_node['url']}/api/v1/p2p/sync/trigger"
                async with session.post(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ Sync triggered: {data['message']}")
                    else:
                        error = await response.text()
                        print(f"❌ Failed to trigger sync: {error}")
            except Exception as e:
                print(f"❌ Error triggering sync: {e}")
        print()
    
    async def verify_user_sync(self, username):
        """Verify that user exists on both nodes"""
        print(f"🔍 Verifying user sync for '{username}'...")
        
        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=False)
        ) as session:
            for node in self.nodes:
                try:
                    url = f"{node['url']}/api/v1/users/"
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            users = data.get('users', [])
                            
                            user_found = any(user['username'] == username for user in users)
                            status = "✅" if user_found else "❌"
                            print(f"   {status} {node['name']}: User {'found' if user_found else 'not found'}")
                        else:
                            print(f"   ❌ {node['name']}: HTTP {response.status}")
                except Exception as e:
                    print(f"   ❌ {node['name']}: {e}")
        print()
    
    async def test_sync_status(self):
        """Test sync status endpoints"""
        print("📈 Testing sync status...")
        
        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=False)
        ) as session:
            try:
                url = f"{self.local_node['url']}/api/v1/p2p/sync-status"
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ Local sync status:")
                        print(f"   Running: {data['sync_running']}")
                        print(f"   Active peers: {data['active_peers']}")
                        if data.get('last_sync_status'):
                            sync_status = data['last_sync_status']
                            print(f"   Last sync: {sync_status.get('tables_synced', 0)} tables")
                            print(f"   Conflicts: {sync_status.get('conflicts_resolved', 0)}")
                    else:
                        print(f"❌ Failed to get sync status: HTTP {response.status}")
            except Exception as e:
                print(f"❌ Error getting sync status: {e}")
        print()
    
    async def run_full_test(self):
        """Run full remote P2P test suite"""
        print("=" * 70)
        print("🌐 REMOTE P2P SYNC TEST SUITE")
        print("=" * 70)
        print()
        
        # Test 1: Basic connectivity
        await self.test_connectivity()
        
        # Test 2: P2P status
        await self.test_p2p_status()
        
        # Test 3: Setup peer connections
        if not await self.setup_peer_connection():
            print("❌ Failed to setup peer connections. Aborting test.")
            return
        
        # Test 4: Sync status
        await self.test_sync_status()
        
        # Test 5: Data creation and sync
        await self.test_data_creation_and_sync()
        
        print("=" * 70)
        print("✅ REMOTE P2P TEST COMPLETED")
        print("=" * 70)

async def main():
    """Main test function"""
    
    # Check if remote URL is set
    remote_url = os.getenv("REMOTE_P2P_URL")
    if not remote_url or remote_url == "https://example.ngrok.io":
        print("❌ Please set REMOTE_P2P_URL environment variable")
        print("   Example: export REMOTE_P2P_URL=https://abc123.ngrok.io")
        print("   Or: set REMOTE_P2P_URL=https://abc123.ngrok.io (Windows)")
        return
    
    tester = RemoteP2PTest()
    
    try:
        await tester.run_full_test()
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")

if __name__ == "__main__":
    print("🚀 Remote P2P Sync Test")
    print("Make sure:")
    print("1. Local node is running on http://localhost:8000")
    print("2. Remote node is accessible via ngrok")
    print("3. REMOTE_P2P_URL environment variable is set")
    print()
    
    asyncio.run(main())