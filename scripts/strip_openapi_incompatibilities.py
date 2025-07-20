#!/usr/bin/env python3
"""
Script to strip OpenAPI 3.1.0 specific fields that are incompatible with OpenAPI 3.0.x
This is needed for tools like oasdiff that only support OpenAPI 3.0.x
"""

import argparse
import json
import sys
import os

def strip_openapi_31_incompatibilities(spec):
    """
    Strip OpenAPI 3.1.0 specific fields that are incompatible with OpenAPI 3.0.x
    This is needed for tools like oasdiff that only support OpenAPI 3.0.x
    """
    if isinstance(spec, dict):
        # Remove exclusiveMinimum and exclusiveMaximum fields
        spec.pop('exclusiveMinimum', None)
        spec.pop('exclusiveMaximum', None)
        
        # Recursively process all values
        for key, value in spec.items():
            spec[key] = strip_openapi_31_incompatibilities(value)
    elif isinstance(spec, list):
        # Recursively process all items in lists
        return [strip_openapi_31_incompatibilities(item) for item in spec]
    
    return spec

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