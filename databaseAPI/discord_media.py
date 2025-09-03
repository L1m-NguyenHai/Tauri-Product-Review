# Discord bot integration for media upload
import os
import discord
from discord import File
from dotenv import load_dotenv
import logging
import asyncio
import threading
from concurrent.futures import Future

# Load environment variables
load_dotenv()
DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
DISCORD_GUILD_ID = int(os.getenv('DISCORD_GUILD_ID', '0'))
DISCORD_CHANNEL_ID = int(os.getenv('DISCORD_CHANNEL_ID', '0'))

logger = logging.getLogger(__name__)

class DiscordMediaUploader(discord.Client):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.ready_event = asyncio.Event()
        self.loop = None

    async def on_ready(self):
        logger.info(f'Discord bot logged in as {self.user}')
        self.ready_event.set()

    async def _upload_media_async(self, file_path: str) -> str:
        """Internal async method to upload file"""
        try:
            await self.ready_event.wait()
            
            channel = self.get_channel(DISCORD_CHANNEL_ID)
            if channel is None:
                raise Exception(f'Discord channel {DISCORD_CHANNEL_ID} not found')
            
            # Check file size (Discord limit is 25MB for regular servers)
            file_size = os.path.getsize(file_path)
            if file_size > 25 * 1024 * 1024:  # 25MB
                raise Exception(f'File too large: {file_size} bytes (max 25MB)')
            
            # Create Discord file object
            discord_file = File(file_path)
            
            # Send to channel
            msg = await channel.send(file=discord_file)
            
            if msg.attachments:
                url = msg.attachments[0].url
                logger.info(f'Successfully uploaded file to Discord: {url}')
                return url
            else:
                raise Exception('No attachment URL returned from Discord')
                
        except Exception as e:
            logger.error(f'Error uploading file to Discord: {e}')
            raise Exception(f'Discord upload failed: {str(e)}')

    def upload_media_sync(self, file_path: str) -> str:
        """Synchronous wrapper for uploading media"""
        if not self.loop or self.loop.is_closed():
            raise Exception("Discord bot is not running or loop is closed")
        
        # Create a future to get the result
        future = asyncio.run_coroutine_threadsafe(
            self._upload_media_async(file_path), 
            self.loop
        )
        
        # Wait for result with timeout
        try:
            return future.result(timeout=30)  # 30 second timeout
        except asyncio.TimeoutError:
            raise Exception("Upload timeout after 30 seconds")

discord_client = None
bot_thread = None

def start_discord_bot():
    """Start the Discord bot in a background thread"""
    global discord_client, bot_thread
    
    if not DISCORD_BOT_TOKEN:
        logger.warning('DISCORD_BOT_TOKEN not set, Discord media upload will not work')
        return
    
    if discord_client is not None:
        logger.info('Discord bot already started')
        return
    
    def run_bot():
        global discord_client
        # Create new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Create client with intents
        intents = discord.Intents.default()
        discord_client = DiscordMediaUploader(intents=intents)
        discord_client.loop = loop
        
        try:
            loop.run_until_complete(discord_client.start(DISCORD_BOT_TOKEN))
        except Exception as e:
            logger.error(f'Discord bot failed to start: {e}')
        finally:
            if not loop.is_closed():
                loop.close()
    
    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()
    logger.info('Discord bot thread started')

async def upload_media(file_path: str) -> str:
    """Upload media file to Discord (async wrapper)"""
    global discord_client
    
    if discord_client is None:
        raise Exception("Discord bot not initialized")
    
    return discord_client.upload_media_sync(file_path)
