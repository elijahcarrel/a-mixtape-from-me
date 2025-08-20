import traceback
import httpx


# Utility functions for better test assertions
# TODO: consider an off-the-shelf library for this.
def assert_response(response: httpx.Response, expected_status: int) -> None:
    """Assert that a response matches the given status code with detailed error information"""
    if response.status_code != expected_status:
        error_detail = f"Expected status {expected_status}, got {response.status_code}"
        if response.text:
            # TODO: standardize error formats and then won't need this try/catch.
            try:
                error_json = response.json()
                if "detail" in error_json:
                    error_detail += f"\nError detail: {error_json['detail']}"
                else:
                    error_detail += f"\nResponse body: {response.text}"
            except: # noqa: E722
                error_detail += f"\nResponse body: {response.text}"

        # Create a custom exception that will show the calling line
        caller_frame = traceback.extract_stack()
        error_detail += f"\n\nCalled from: {caller_frame.filename}:{caller_frame.lineno} in {caller_frame.name}"
        error_detail += f"\nLine: {caller_frame.line}"

        raise AssertionError(error_detail)

def assert_response_success(response: httpx.Response) -> None:
    """Assert that a response indicates success (200)"""
    assert_response(response, 200)

def assert_response_created(response: httpx.Response) -> None:
    """Assert that a response indicates successful creation (201)"""
    assert_response(response, 201)

def assert_response_not_found(response: httpx.Response) -> None:
    """Assert that a response indicates not found (404)"""
    assert_response(response, 404)

def assert_response_bad_request(response: httpx.Response) -> None:
    """Assert that a response indicates bad request (400)"""
    assert_response(response, 400)

def assert_response_validation_error(response: httpx.Response) -> None:
    """Assert that a response indicates validation error (422)"""
    assert_response(response, 422)
