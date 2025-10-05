#!/usr/bin/env python3
"""
Script to add remote peer via ngrok
"""
import requests
import json

def add_remote_peer(local_node_url: str, remote_ngrok_url: str, peer_id: str):
    """Add a remote peer via ngrok URL"""
    
    peer_data = {
        "url": remote_ngrok_url,
        "peer_id": peer_id,
        "ssl_verify": True  # ngrok uses HTTPS
    }
    
    try:
        response = requests.post(
            f"{local_node_url}/api/v1/p2p/peers",
            json=peer_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print(f"✓ Successfully added remote peer {peer_id}")
            print(f"  URL: {remote_ngrok_url}")
            return True
        else:
            print(f"✗ Failed to add peer: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Error adding peer: {e}")
        return False

def list_peers(node_url: str):
    """List all peers for a node"""
    try:
        response = requests.get(f"{node_url}/api/v1/p2p/peers")
        if response.status_code == 200:
            peers = response.json()
            print(f"\nPeers for {node_url}:")
            for peer in peers:
                print(f"  - {peer['peer_id']}: {peer['url']} (Status: {peer.get('status', 'unknown')})")
        else:
            print(f"Failed to get peers: {response.status_code}")
    except Exception as e:
        print(f"Error getting peers: {e}")

def trigger_manual_sync(node_url: str):
    """Trigger manual sync"""
    try:
        response = requests.post(f"{node_url}/api/v1/p2p/sync/manual")
        if response.status_code == 200:
            print(f"✓ Manual sync triggered on {node_url}")
        else:
            print(f"✗ Failed to trigger sync: {response.status_code}")
    except Exception as e:
        print(f"Error triggering sync: {e}")

if __name__ == "__main__":
    import sys
    
    print("ngrok P2P Remote Connection Setup")
    print("=" * 40)
    
    if len(sys.argv) < 4:
        print("Usage: python setup_remote_peer.py <local_node_url> <remote_ngrok_url> <peer_id>")
        print()
        print("Example:")
        print("  python setup_remote_peer.py http://localhost:8000 https://abc123.ngrok.io remote-node-1")
        print()
        print("Steps:")
        print("1. Start your local node: uvicorn app:app --host 0.0.0.0 --port 8000")
        print("2. Start ngrok on remote machine: ngrok http 8000")
        print("3. Run this script with the ngrok URL")
        sys.exit(1)
    
    local_url = sys.argv[1]
    remote_url = sys.argv[2] 
    peer_id = sys.argv[3]
    
    print(f"Local Node: {local_url}")
    print(f"Remote Node: {remote_url}")
    print(f"Peer ID: {peer_id}")
    print()
    
    # Add remote peer
    if add_remote_peer(local_url, remote_url, peer_id):
        print()
        
        # List peers to verify
        list_peers(local_url)
        print()
        
        # Trigger manual sync
        print("Triggering manual sync...")
        trigger_manual_sync(local_url)
        
        print()
        print("✓ Remote peer setup complete!")
        print("The nodes should now sync automatically.")
        
    else:
        print("✗ Failed to setup remote peer")
        sys.exit(1)