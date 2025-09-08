import sys
import asyncio
import os
import logging
from discord_media import upload_media_to_discord

# Setup logging to see what's happening
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_discord_upload.py <image_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        sys.exit(1)
    
    async def main():
        try:
            print(f"Testing Discord upload for: {image_path}")
            url = await upload_media_to_discord(image_path)
            print(f"✅ Upload successful!")
            print(f"Uploaded URL: {url}")
        except Exception as e:
            print(f"❌ Upload failed: {e}")
            import traceback
            traceback.print_exc()
    
    asyncio.run(main())
