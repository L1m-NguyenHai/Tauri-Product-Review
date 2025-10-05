"""
P2P Sync Hooks
Automatically trigger sync when data changes occur
"""
import logging
from typing import List
from .sync_manager import data_sync_manager

logger = logging.getLogger(__name__)

class P2PSyncHooks:
    """Hooks to trigger P2P sync when data changes"""
    
    @staticmethod
    async def on_user_created(user_id: int):
        """Trigger sync when user is created"""
        try:
            await data_sync_manager.trigger_sync_after_data_change("users")
            logger.info(f"Triggered P2P sync after user {user_id} created")
        except Exception as e:
            logger.error(f"Error triggering sync after user creation: {e}")
    
    @staticmethod
    async def on_user_updated(user_id: int):
        """Trigger sync when user is updated"""
        try:
            await data_sync_manager.trigger_sync_after_data_change("users")
            logger.info(f"Triggered P2P sync after user {user_id} updated")
        except Exception as e:
            logger.error(f"Error triggering sync after user update: {e}")
    
    @staticmethod
    async def on_product_created(product_id: int):
        """Trigger sync when product is created"""
        try:
            await data_sync_manager.trigger_sync_after_data_change("products")
            logger.info(f"Triggered P2P sync after product {product_id} created")
        except Exception as e:
            logger.error(f"Error triggering sync after product creation: {e}")
    
    @staticmethod
    async def on_product_updated(product_id: int):
        """Trigger sync when product is updated"""
        try:
            await data_sync_manager.trigger_sync_after_data_change("products")
            logger.info(f"Triggered P2P sync after product {product_id} updated")
        except Exception as e:
            logger.error(f"Error triggering sync after product update: {e}")
    
    @staticmethod
    async def on_review_created(review_id: int):
        """Trigger sync when review is created"""
        try:
            await data_sync_manager.trigger_sync_after_data_change("reviews")
            logger.info(f"Triggered P2P sync after review {review_id} created")
        except Exception as e:
            logger.error(f"Error triggering sync after review creation: {e}")
    
    @staticmethod
    async def on_review_updated(review_id: int):
        """Trigger sync when review is updated"""
        try:
            await data_sync_manager.trigger_sync_after_data_change("reviews")
            logger.info(f"Triggered P2P sync after review {review_id} updated")
        except Exception as e:
            logger.error(f"Error triggering sync after review update: {e}")
    
    @staticmethod
    async def on_category_created(category_id: int):
        """Trigger sync when category is created"""
        try:
            await data_sync_manager.trigger_sync_after_data_change("categories")
            logger.info(f"Triggered P2P sync after category {category_id} created")
        except Exception as e:
            logger.error(f"Error triggering sync after category creation: {e}")
    
    @staticmethod
    async def on_category_updated(category_id: int):
        """Trigger sync when category is updated"""
        try:
            await data_sync_manager.trigger_sync_after_data_change("categories")
            logger.info(f"Triggered P2P sync after category {category_id} updated")
        except Exception as e:
            logger.error(f"Error triggering sync after category update: {e}")
    
    @staticmethod
    async def on_multiple_tables_changed(tables: List[str]):
        """Trigger sync when multiple tables are changed"""
        try:
            for table in tables:
                await data_sync_manager.trigger_sync_after_data_change(table)
            logger.info(f"Triggered P2P sync after tables {tables} changed")
        except Exception as e:
            logger.error(f"Error triggering sync after multiple table changes: {e}")

# Global hooks instance
p2p_hooks = P2PSyncHooks()