# Discord bot integration for media upload
import os
import discord
from discord import File
from dotenv import load_dotenv
import logging
import asyncio
from typing import Optional

# Load environment variables
load_dotenv()
DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
DISCORD_GUILD_ID = int(os.getenv('DISCORD_GUILD_ID', '0'))
DISCORD_CHANNEL_ID = int(os.getenv('DISCORD_CHANNEL_ID', '0'))

logger = logging.getLogger(__name__)

class SimpleDiscordUploader:
    def __init__(self):
        self.client: Optional[discord.Client] = None
        self.ready = False

    async def upload_file(self, file_path: str) -> str:
        """Upload file to Discord and return URL"""
        try:
            logger.info(f"Starting upload for file: {file_path}")
            
            if not DISCORD_BOT_TOKEN:
                raise Exception('DISCORD_BOT_TOKEN not set in environment')
            
            # Check file exists and size first
            if not os.path.exists(file_path):
                raise Exception(f'File not found: {file_path}')
            
            file_size = os.path.getsize(file_path)
            if file_size > 25 * 1024 * 1024:  # 25MB Discord limit
                raise Exception(f'File too large: {file_size} bytes (max 25MB)')
            
            # Check if file is actually empty (0 bytes means it's probably a directory)
            if file_size == 0:
                raise Exception(f'File is empty or is a directory: {file_path}')
            
            logger.info(f"File size: {file_size} bytes")
            
            # Create client with intents
            intents = discord.Intents.default()
            intents.message_content = True
            
            client = discord.Client(intents=intents)
            
            # Set up event handler for when ready
            ready_event = asyncio.Event()
            
            @client.event
            async def on_ready():
                logger.info(f'Discord bot logged in as {client.user}')
                ready_event.set()
            
            try:
                logger.info("Discord client created, logging in...")
                
                # Start the client in the background
                client_task = asyncio.create_task(client.start(DISCORD_BOT_TOKEN))
                
                # Wait for the bot to be ready with a timeout
                try:
                    await asyncio.wait_for(ready_event.wait(), timeout=10.0)
                except asyncio.TimeoutError:
                    raise Exception("Discord login timeout after 10 seconds")
                
                # Get channel
                channel = client.get_channel(DISCORD_CHANNEL_ID)
                if channel is None:
                    # Try to fetch channel if not in cache
                    try:
                        channel = await client.fetch_channel(DISCORD_CHANNEL_ID)
                    except Exception as fetch_error:
                        raise Exception(f'Discord channel {DISCORD_CHANNEL_ID} not found or no access: {fetch_error}')
                
                logger.info(f"Found Discord channel: {channel.name}")
                
                # Upload to Discord
                with open(file_path, 'rb') as f:
                    discord_file = File(f, filename=os.path.basename(file_path))
                    msg = await channel.send(file=discord_file)
                
                if msg.attachments:
                    url = msg.attachments[0].url
                    logger.info(f'Successfully uploaded to Discord: {url}')
                    return url
                else:
                    raise Exception('No attachment URL returned from Discord')
                    
            finally:
                # Always close the client
                if not client.is_closed():
                    await client.close()
                
        except Exception as e:
            logger.error(f'Discord upload failed: {e}')
            raise

async def upload_media_to_discord(file_path: str) -> str:
    """Upload media file to Discord and return URL"""
    try:
        uploader = SimpleDiscordUploader()
        return await uploader.upload_file(file_path)
    except Exception as e:
        logger.error(f"Failed to upload media to Discord: {e}")
        raise Exception(f"Discord upload failed: {str(e)}")

# Legacy function for backward compatibility
def start_discord_bot():
    """Start the Discord bot (legacy function - bot will start on first use)"""
    logger.info('Discord bot will be started on first media upload')
    pass
