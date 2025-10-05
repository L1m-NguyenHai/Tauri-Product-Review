#!/usr/bin/env python3
"""
Test P2P Sync Functionality
Tests bidirectional sync between nodes with automatic triggers
"""
import asyncio
import aiohttp
import json
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Node configurations
NODES = {
    "node1": {
        "url": "http://localhost:8001",
        "name": "Node 1 (Port 8001)"
    },
    "node2": {
        "url": "http://localhost:8002", 
        "name": "Node 2 (Port 8002)"
    },
    "node3": {
        "url": "http://localhost:8003",
        "name": "Node 3 (Port 8003)"
    }
}

# Test credentials
TEST_USER = {
    "email": "testuser@example.com",
    "password": "testpassword123",
    "name": "Test User"
}

ADMIN_USER = {
    "email": "admin@example.com", 
    "password": "adminpassword123",
    "name": "Admin User"
}

class P2PSyncTester:
    def __init__(self):
        self.session = None
        self.tokens = {}  # Store auth tokens for each node
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def register_and_login(self, node_url: str, user_data: dict) -> str:
        """Register user and get auth token"""
        try:
            # Try to register user
            async with self.session.post(f"{node_url}/auth/register", json=user_data) as resp:
                if resp.status == 200:
                    logger.info(f"User registered successfully on {node_url}")
                elif resp.status == 400:
                    logger.info(f"User already exists on {node_url}")
                else:
                    logger.error(f"Registration failed on {node_url}: {resp.status}")
            
            # Login to get token
            login_data = {"email": user_data["email"], "password": user_data["password"]}
            async with self.session.post(f"{node_url}/auth/login", json=login_data) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data["access_token"]
                else:
                    logger.error(f"Login failed on {node_url}: {resp.status}")
                    return None
        except Exception as e:
            logger.error(f"Auth error on {node_url}: {e}")
            return None
    
    async def setup_authentication(self):
        """Setup authentication for all nodes"""
        logger.info("Setting up authentication for all nodes...")
        
        for node_id, node_info in NODES.items():
            # Setup regular user
            token = await self.register_and_login(node_info["url"], TEST_USER)
            if token:
                self.tokens[f"{node_id}_user"] = token
                logger.info(f"✓ User authenticated on {node_info['name']}")
            
            # Setup admin user  
            admin_token = await self.register_and_login(node_info["url"], ADMIN_USER)
            if admin_token:
                self.tokens[f"{node_id}_admin"] = admin_token
                logger.info(f"✓ Admin authenticated on {node_info['name']}")
    
    async def create_test_data(self, node_id: str, node_url: str) -> dict:
        """Create test data on a specific node"""
        results = {}
        
        # Get tokens
        user_token = self.tokens.get(f"{node_id}_user")
        admin_token = self.tokens.get(f"{node_id}_admin")
        
        if not user_token or not admin_token:
            logger.error(f"Missing tokens for {node_id}")
            return results
        
        headers_user = {"Authorization": f"Bearer {user_token}"}
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        
        try:
            # Create category (admin only)
            category_data = {
                "name": f"Test Category from {node_id}",
                "description": f"Test category created on {node_id} at {datetime.now()}"
            }
            async with self.session.post(f"{node_url}/categories/", 
                                       json=category_data, headers=headers_admin) as resp:
                if resp.status == 200:
                    category = await resp.json()
                    results["category"] = category
                    logger.info(f"✓ Category created on {node_id}: {category['id']}")
                else:
                    logger.error(f"Category creation failed on {node_id}: {resp.status}")
            
            # Create product
            if "category" in results:
                product_data = {
                    "name": f"Test Product from {node_id}",
                    "description": f"Test product created on {node_id}",
                    "category_id": results["category"]["id"],
                    "manufacturer": f"Manufacturer {node_id}",
                    "price": 99.99,
                    "availability": "in_stock",
                    "status": "active"
                }
                async with self.session.post(f"{node_url}/products/", 
                                           json=product_data, headers=headers_user) as resp:
                    if resp.status == 200:
                        product = await resp.json()
                        results["product"] = product
                        logger.info(f"✓ Product created on {node_id}: {product['id']}")
                    else:
                        logger.error(f"Product creation failed on {node_id}: {resp.status}")
            
            # Create review
            if "product" in results:
                review_data = {
                    "product_id": results["product"]["id"],
                    "rating": 5,
                    "title": f"Great product from {node_id}",
                    "content": f"This is a test review created on {node_id}"
                }
                async with self.session.post(f"{node_url}/reviews/", 
                                           json=review_data, headers=headers_user) as resp:
                    if resp.status == 200:
                        review = await resp.json()
                        results["review"] = review
                        logger.info(f"✓ Review created on {node_id}: {review['id']}")
                    else:
                        logger.error(f"Review creation failed on {node_id}: {resp.status}")
                        
        except Exception as e:
            logger.error(f"Error creating test data on {node_id}: {e}")
        
        return results
    
    async def check_sync_status(self, node_url: str) -> dict:
        """Check P2P sync status"""
        try:
            async with self.session.get(f"{node_url}/p2p/status") as resp:
                if resp.status == 200:
                    return await resp.json()
                else:
                    logger.error(f"Failed to get sync status from {node_url}: {resp.status}")
                    return {}
        except Exception as e:
            logger.error(f"Error checking sync status on {node_url}: {e}")
            return {}
    
    async def count_records(self, node_url: str, table: str) -> int:
        """Count records in a table via API"""
        try:
            endpoint_map = {
                "users": "/users/",
                "categories": "/categories/", 
                "products": "/products/",
                "reviews": "/reviews/"
            }
            
            endpoint = endpoint_map.get(table, f"/{table}/")
            async with self.session.get(f"{node_url}{endpoint}?limit=1000") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if isinstance(data, list):
                        return len(data)
                    elif isinstance(data, dict) and "data" in data:
                        return len(data["data"])
                    elif isinstance(data, dict) and "total" in data:
                        return data["total"]
                    else:
                        return 0
                else:
                    logger.error(f"Failed to count {table} on {node_url}: {resp.status}")
                    return 0
        except Exception as e:
            logger.error(f"Error counting {table} on {node_url}: {e}")
            return 0
    
    async def wait_for_sync(self, timeout: int = 30):
        """Wait for sync to complete"""
        logger.info(f"Waiting {timeout} seconds for P2P sync to complete...")
        await asyncio.sleep(timeout)
    
    async def verify_sync_results(self) -> dict:
        """Verify that data is synchronized across all nodes"""
        logger.info("Verifying sync results across all nodes...")
        
        results = {}
        tables = ["users", "categories", "products", "reviews"]
        
        for table in tables:
            counts = {}
            for node_id, node_info in NODES.items():
                count = await self.count_records(node_info["url"], table)
                counts[node_id] = count
                logger.info(f"{node_info['name']} has {count} {table}")
            
            results[table] = counts
            
            # Check if all nodes have the same count
            unique_counts = set(counts.values())
            if len(unique_counts) == 1:
                logger.info(f"✓ {table} synchronized successfully across all nodes")
            else:
                logger.warning(f"⚠ {table} counts differ: {counts}")
        
        return results
    
    async def run_comprehensive_test(self):
        """Run comprehensive P2P sync test"""
        logger.info("="*60)
        logger.info("Starting Comprehensive P2P Sync Test")
        logger.info("="*60)
        
        # Setup authentication
        await self.setup_authentication()
        await asyncio.sleep(2)
        
        # Check initial sync status
        logger.info("\n" + "="*40)
        logger.info("Initial Sync Status")
        logger.info("="*40)
        for node_id, node_info in NODES.items():
            status = await self.check_sync_status(node_info["url"])
            logger.info(f"{node_info['name']}: {status.get('active_peers', 0)} active peers")
        
        # Get initial counts
        logger.info("\n" + "="*40)
        logger.info("Initial Record Counts")
        logger.info("="*40)
        initial_counts = await self.verify_sync_results()
        
        # Create test data on different nodes
        logger.info("\n" + "="*40)
        logger.info("Creating Test Data")
        logger.info("="*40)
        
        test_data = {}
        for i, (node_id, node_info) in enumerate(NODES.items()):
            if i < 2:  # Only create data on first 2 nodes
                logger.info(f"Creating test data on {node_info['name']}...")
                data = await self.create_test_data(node_id, node_info["url"])
                test_data[node_id] = data
                await asyncio.sleep(2)  # Brief pause between creations
        
        # Wait for sync
        await self.wait_for_sync(45)
        
        # Verify final results
        logger.info("\n" + "="*40)
        logger.info("Final Sync Verification")
        logger.info("="*40)
        final_counts = await self.verify_sync_results()
        
        # Check sync status after test
        logger.info("\n" + "="*40)
        logger.info("Final Sync Status")
        logger.info("="*40)
        for node_id, node_info in NODES.items():
            status = await self.check_sync_status(node_info["url"])
            logger.info(f"{node_info['name']}: {json.dumps(status, indent=2)}")
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("Test Summary")
        logger.info("="*60)
        
        success = True
        for table in ["categories", "products", "reviews"]:
            initial = initial_counts.get(table, {})
            final = final_counts.get(table, {})
            
            # Check if counts increased and are consistent
            if final:
                final_values = list(final.values())
                if len(set(final_values)) == 1 and all(final_values[i] > initial.get(list(NODES.keys())[i], 0) for i in range(len(final_values))):
                    logger.info(f"✓ {table}: Successfully synced (consistent counts)")
                else:
                    logger.error(f"✗ {table}: Sync failed (inconsistent counts)")
                    success = False
        
        if success:
            logger.info("🎉 P2P Bidirectional Sync Test PASSED!")
        else:
            logger.error("❌ P2P Bidirectional Sync Test FAILED!")
        
        return success

async def main():
    """Main test function"""
    async with P2PSyncTester() as tester:
        success = await tester.run_comprehensive_test()
        return success

if __name__ == "__main__":
    import sys
    
    print("P2P Sync Test Script")
    print("This script tests bidirectional sync between multiple nodes")
    print("Make sure all 3 nodes are running on ports 8001, 8002, 8003")
    print()
    
    success = asyncio.run(main())
    sys.exit(0 if success else 1)