#!/usr/bin/env python3
"""
Script to remove AWS X-Ray SDK imports and decorators from Lambda functions
"""

import re
import sys
from pathlib import Path

def remove_xray_from_file(file_path):
    """Remove X-Ray SDK imports and decorators from a Python file"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        original_content = content
        
        # Remove X-Ray import lines
        content = re.sub(r'^from aws_xray_sdk\.core import xray_recorder\n', '', content, flags=re.MULTILINE)
        content = re.sub(r'^from aws_xray_sdk import xray_recorder\n', '', content, flags=re.MULTILINE)
        content = re.sub(r'^import aws_xray_sdk.*\n', '', content, flags=re.MULTILINE)
        
        # Remove X-Ray decorators
        content = re.sub(r'^\s*@xray_recorder\.capture\([^)]+\)\n', '', content, flags=re.MULTILINE)
        
        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"✓ Cleaned {file_path}")
            return True
        else:
            print(f"- No changes needed for {file_path}")
            return False
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return False

def main():
    # Files to process
    files = [
        './scraping/index.py',
        './chat-mentor/index.py',
        './analysis/index.py',
        './interview-simulator/bedrock_client.py',
        './interview-simulator/auth.py',
        './interview-simulator/ai_interviewer.py',
        './interview-simulator/index.py',
        './interview-simulator/cache_manager.py',
        './interview-simulator/session_manager.py',
        './interview-simulator/challenge_selector.py',
        './interview-simulator/performance_scorer.py',
        './rag/index.py',
        './recommendations/index.py',
        './genai/llm_cache.py',
    ]
    
    cleaned_count = 0
    for file_path in files:
        if remove_xray_from_file(file_path):
            cleaned_count += 1
    
    print(f"\n✓ Cleaned {cleaned_count} files")

if __name__ == '__main__':
    main()
