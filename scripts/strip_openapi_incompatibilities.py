#!/usr/bin/env python3
"""
Script to strip OpenAPI 3.1.0 specific fields that are incompatible with OpenAPI 3.0.x
This is needed for tools like oasdiff that only support OpenAPI 3.0.x
"""

import argparse
import json
import sys
import os

# Add the scripts directory to the path so we can import openapi_utils
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openapi_utils import strip_openapi_31_incompatibilities

def main():
    parser = argparse.ArgumentParser(description='Strip OpenAPI 3.1.0 incompatibilities from JSON file')
    parser.add_argument('input', help='Input OpenAPI JSON file')
    parser.add_argument('output', help='Output OpenAPI JSON file')
    
    args = parser.parse_args()
    
    # Read the input file
    with open(args.input, 'r') as f:
        spec = json.load(f)
    
    # Strip incompatibilities
    spec = strip_openapi_31_incompatibilities(spec)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    
    # Write the output file
    with open(args.output, 'w') as f:
        json.dump(spec, f, indent=4)
    
    print(f"Processed {args.input} -> {args.output}")

if __name__ == '__main__':
    main() 