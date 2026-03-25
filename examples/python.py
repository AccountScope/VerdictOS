#!/usr/bin/env python3
"""
VerdictOS Python Example
Install: pip install requests
"""

import os
import requests
import time
from typing import Dict, Any

API_URL = os.environ.get('VERDICTOS_API_URL', 'https://api.verdictos.tech')
API_KEY = os.environ['VERDICTOS_API_KEY']
CLIENT_ID = os.environ['VERDICTOS_CLIENT_ID']


def submit_action(action_type: str, payload: Dict[str, Any], requested_by: str = 'system') -> Dict[str, Any]:
    """Submit an action to VerdictOS for evaluation."""
    response = requests.post(
        f'{API_URL}/api/v1/actions',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
            'X-Client-ID': CLIENT_ID,
            'Idempotency-Key': f'{action_type}-{int(time.time())}'
        },
        json={
            'action_type': action_type,
            'requested_by': requested_by,
            'payload': payload
        }
    )
    
    response.raise_for_status()
    return response.json()


def example1_low_risk():
    """Example 1: Low-risk payment (auto-approved)."""
    print('\n=== Example 1: Low-risk payment ===')
    
    result = submit_action('send_payment', {
        'amount': 5000,
        'recipient': 'vendor@example.com',
        'currency': 'USD'
    }, 'john@company.com')

    data = result['data']
    print(f"Decision: {data['decision']}")
    print(f"Risk Score: {data['risk_score']} ({data['numeric_score']}/100)")
    print(f"Explanation: {data['explanation']}")

    if data['decision'] == 'ALLOW':
        print('✓ Payment can proceed immediately')
        # Execute payment here


def example2_high_risk():
    """Example 2: High-risk payment (requires approval)."""
    print('\n=== Example 2: High-risk payment ===')
    
    result = submit_action('send_payment', {
        'amount': 250000,
        'recipient': 'new-vendor@example.com',
        'recipient_history': 'first_transaction',
        'currency': 'USD'
    }, 'john@company.com')

    data = result['data']
    print(f"Decision: {data['decision']}")
    print(f"Risk Score: {data['risk_score']} ({data['numeric_score']}/100)")
    print(f"Explanation: {data['explanation']}")
    print(f"Triggered Rules: {', '.join(data['triggered_rules'])}")

    if data['decision'] == 'REQUIRE_APPROVAL':
        print('⏳ Approval email sent to CFO')
        print(f"Action ID: {data['action_id']}")
        # Queue for approval, wait for email approval


def example3_blocked():
    """Example 3: Blocked action."""
    print('\n=== Example 3: Blocked action ===')
    
    result = submit_action('delete_user', {
        'user_id': 'admin_user_123',
        'force': True
    }, 'john@company.com')

    data = result['data']
    print(f"Decision: {data['decision']}")
    print(f"Risk Score: {data['risk_score']} ({data['numeric_score']}/100)")
    print(f"Explanation: {data['explanation']}")

    if data['decision'] == 'BLOCK':
        print('🚫 Action permanently blocked')
        # Log incident, alert security team


def main():
    """Run all examples."""
    try:
        example1_low_risk()
        example2_high_risk()
        example3_blocked()
    except requests.exceptions.RequestException as err:
        print(f'Error: {err}')
    except KeyError as err:
        print(f'Environment variable missing: {err}')


if __name__ == '__main__':
    main()
