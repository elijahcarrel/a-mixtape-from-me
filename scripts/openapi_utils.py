#!/usr/bin/env python3
"""
Shared utilities for OpenAPI schema processing
"""

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