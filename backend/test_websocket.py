"""Test WebSocket connection"""
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/ws/1"
    try:
        async with websockets.connect(uri) as websocket:
            print("+ Connected to WebSocket server")
            
            # Send a test message
            await websocket.send(json.dumps({"type": "test", "message": "Hello from test client"}))
            print("+ Sent test message")
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"+ Received response: {response}")
            except asyncio.TimeoutError:
                print("WARNING: No response received (this is OK if server doesn't echo)")
            
            print("\n+ WebSocket connection test successful!")
            
    except Exception as e:
        print(f"ERROR: WebSocket connection failed: {e}")
        print("Make sure the backend server is running on port 8000")

if __name__ == "__main__":
    asyncio.run(test_websocket())
