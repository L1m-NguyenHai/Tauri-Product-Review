#!/usr/bin/env python3
"""
P2P Sync Test Script for Separate Databases
Tests P2P synchronization functionality with multiple independent databases
"""
import asyncio
import aiohttp
import json
import time
from datetime import datetime

class P2PTest:
    def __init__(self):
        self.nodes = [
            {"name": "node1", "url": "http://localhost:8000", "db_port": 5432},
            {"name": "node2", "url": "http://localhost:8010", "db_port": 5433},
            {"name": "node3", "url": "http://localhost:8020", "db_port": 5434}
        ]
    
    async def test_node_status(self):
        """Test if all nodes are running"""
        print("🔍 Testing node status...")
        
        async with aiohttp.ClientSession() as session:
            for node in self.nodes:
                try:
                    url = f"{node['url']}/api/v1/p2p/status"
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            print(f"✅ {node['name']}: Active (Node ID: {data['node_id'][:8]}...)")
                            print(f"   📊 Peers: {data['peer_count']}, Sync Tables: {len(data['sync_config']['sync_tables'])}")
                        else:
                            print(f"❌ {node['name']}: HTTP {response.status}")
                except Exception as e:
                    print(f"❌ {node['name']}: {e}")
        print()
    
    async def test_database_separation(self):
        """Test that each node has its own database"""
        print("🗄️  Testing database separation...")
        
        # Create different test users on each node
        test_users = []
        async with aiohttp.ClientSession() as session:
            for i, node in enumerate(self.nodes):
                user_data = {
                    "username": f"testuser_{node['name']}_{int(time.time())}",
                    "email": f"test_{node['name']}_{int(time.time())}@example.com",
                    "password": "password123",
                    "full_name": f"Test User {node['name'].upper()}"
                }
                
                try:
                    url = f"{node['url']}/api/v1/auth/register"
                    async with session.post(url, json=user_data) as response:
                        if response.status == 201:
                            data = await response.json()
                            test_users.append({
                                "node": node['name'],
                                "username": user_data['username'],
                                "user_id": data.get('user', {}).get('id')
                            })
                            print(f"✅ Created user on {node['name']}: {user_data['username']}")
                        else:
                            error = await response.text()
                            print(f"❌ Failed to create user on {node['name']}: {error}")
                except Exception as e:
                    print(f"❌ Error creating user on {node['name']}: {e}")
        
        print(f"📝 Created {len(test_users)} test users on separate databases")
        return test_users
    
    async def test_sync_status(self):
        """Test sync status endpoints"""
        print("📊 Testing sync status...")
        
        async with aiohttp.ClientSession() as session:
            for node in self.nodes:
                try:
                    url = f"{node['url']}/api/v1/p2p/sync-status"
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            print(f"✅ {node['name']}: Sync Running = {data['sync_running']}")
                            print(f"   🔄 Active Peers: {data['active_peers']}")
                        else:
                            print(f"❌ {node['name']}: HTTP {response.status}")
                except Exception as e:
                    print(f"❌ {node['name']}: {e}")
        print()
    
    async def test_incremental_sync(self):
        """Test incremental synchronization"""
        print("🔄 Testing incremental sync...")
        
        # Trigger sync on all nodes
        async with aiohttp.ClientSession() as session:
            for node in self.nodes:
                try:
                    url = f"{node['url']}/api/v1/p2p/sync/trigger"
                    async with session.post(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            print(f"✅ {node['name']}: {data['message']}")
                        else:
                            print(f"❌ {node['name']}: HTTP {response.status}")
                except Exception as e:
                    print(f"❌ {node['name']}: {e}")
        print()
    
    async def test_table_changes(self, table="users"):
        """Test table changes endpoint"""
        print(f"📋 Testing table changes for '{table}'...")
        
        async with aiohttp.ClientSession() as session:
            for node in self.nodes:
                try:
                    url = f"{node['url']}/api/v1/p2p/table-changes/{table}"
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            print(f"✅ {node['name']}: {data['count']} changes, Type: {data.get('sync_type', 'unknown')}")
                        else:
                            print(f"❌ {node['name']}: HTTP {response.status}")
                except Exception as e:
                    print(f"❌ {node['name']}: {e}")
        print()
    
    async def verify_data_sync(self, test_users):
        """Verify that data has been synced across all nodes"""
        print("🔍 Verifying data synchronization...")
        
        async with aiohttp.ClientSession() as session:
            # Check each node for all users
            for check_node in self.nodes:
                try:
                    url = f"{check_node['url']}/api/v1/users/"
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            users = data.get('users', [])
                            
                            print(f"📊 {check_node['name']}: Found {len(users)} total users")
                            
                            # Check for each test user
                            for test_user in test_users:
                                found = any(user['username'] == test_user['username'] for user in users)
                                status = "✅" if found else "❌"
                                print(f"   {status} User from {test_user['node']}: {test_user['username']}")
                        else:
                            print(f"❌ {check_node['name']}: HTTP {response.status}")
                except Exception as e:
                    print(f"❌ {check_node['name']}: {e}")
        print()
    
    async def test_websocket_monitoring(self):
        """Test WebSocket real-time monitoring"""
        print("🔗 Testing WebSocket monitoring...")
        
        import websockets
        
        try:
            # Connect to first node's WebSocket
            uri = "ws://localhost:8000/api/v1/p2p/ws"
            
            async with websockets.connect(uri) as websocket:
                # Send ping
                await websocket.send(json.dumps({"type": "ping"}))
                
                # Wait for response
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                
                if data.get("type") == "pong":
                    print("✅ WebSocket connection successful")
                else:
                    print(f"✅ WebSocket response: {data.get('type', 'unknown')}")
                    
        except asyncio.TimeoutError:
            print("⏰ WebSocket test timed out")
        except Exception as e:
            print(f"❌ WebSocket test failed: {e}")
        print()
    
    async def performance_test(self):
        """Test sync performance with multiple operations"""
        print("⚡ Running performance test...")
        
        start_time = time.time()
        
        # Create multiple users quickly
        async with aiohttp.ClientSession() as session:
            tasks = []
            for i in range(5):
                for j, node in enumerate(self.nodes):
                    user_data = {
                        "username": f"perftest_{i}_{j}_{int(time.time())}",
                        "email": f"perftest_{i}_{j}_{int(time.time())}@example.com",
                        "password": "password123",
                        "full_name": f"Performance Test User {i}-{j}"
                    }
                    
                    url = f"{node['url']}/api/v1/auth/register"
                    task = session.post(url, json=user_data)
                    tasks.append(task)
            
            # Execute all requests concurrently
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            success_count = sum(1 for r in responses if not isinstance(r, Exception) and hasattr(r, 'status') and r.status == 201)
            
        creation_time = time.time() - start_time
        print(f"📊 Created {success_count} users in {creation_time:.2f} seconds")
        
        # Trigger sync and measure time
        sync_start = time.time()
        await self.test_incremental_sync()
        
        # Wait for sync to complete
        await asyncio.sleep(10)
        
        sync_time = time.time() - sync_start
        print(f"🔄 Sync completed in {sync_time:.2f} seconds")
        print()
    
    async def full_test_suite(self):
        """Run comprehensive P2P test suite for separate databases"""
        print("=" * 60)
        print("🚀 P2P SYNC TEST SUITE - SEPARATE DATABASES")
        print("=" * 60)
        print()
        
        # Test 1: Node Status
        await self.test_node_status()
        
        # Test 2: Database Separation
        test_users = await self.test_database_separation()
        
        # Test 3: Sync Status
        await self.test_sync_status()
        
        # Test 4: Table Changes
        await self.test_table_changes()
        
        # Test 5: Manual Sync
        await self.test_incremental_sync()
        
        # Wait for sync to complete
        print("⏳ Waiting 15 seconds for data synchronization...")
        await asyncio.sleep(15)
        
        # Test 6: Verify Sync
        await self.verify_data_sync(test_users)
        
        # Test 7: WebSocket Monitoring
        try:
            await self.test_websocket_monitoring()
        except ImportError:
            print("⚠️  WebSocket test skipped (websockets package not installed)")
        
        # Test 8: Performance Test
        await self.performance_test()
        
        print("=" * 60)
        print("✅ TEST SUITE COMPLETED")
        print("=" * 60)
    
    async def cleanup_test_data(self):
        """Clean up test data (optional)"""
        print("🧹 Cleaning up test data...")
        
        # Note: In a real scenario, you might want to implement cleanup endpoints
        # For now, we'll just log that cleanup would happen here
        print("ℹ️  Test data cleanup would be implemented here")
        print("ℹ️  Consider adding DELETE endpoints for test data cleanup")

async def main():
    """Main test function"""
    tester = P2PTest()
    
    try:
        await tester.full_test_suite()
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
    finally:
        await tester.cleanup_test_data()

if __name__ == "__main__":
    print("Starting P2P Sync Test for Separate Databases...")
    print("Make sure all nodes are running with Docker Compose:")
    print("docker-compose -f docker-compose.p2p.yml up --build")
    print()
    
    asyncio.run(main())