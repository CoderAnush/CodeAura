#!/usr/bin/env python3
"""
Test script to demonstrate CodeAura's advanced features
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_basic_analysis():
    """Test basic code analysis"""
    print("🔍 Testing Basic Code Analysis...")
    
    code_sample = """
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

result = fibonacci(10)
print(result)
"""
    
    payload = {
        "code": code_sample,
        "language": "python",
        "ai_provider": "ollama"
    }
    
    response = requests.post(f"{BASE_URL}/analyze", json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Analysis Successful!")
        print(f"Complexity: {result.get('complexity', 'N/A')}")
        print(f"Issues Found: {len(result.get('issues', []))}")
        print(f"Quality Score: {result.get('quality_metrics', {}).get('quality_score', 'N/A')}")
        print("\nIssues:")
        for issue in result.get('issues', []):
            print(f"  - {issue}")
        return result
    else:
        print(f"❌ Analysis Failed: {response.status_code}")
        print(response.text)
        return None

def test_analytics():
    """Test analytics endpoint"""
    print("\n📊 Testing Analytics...")
    
    response = requests.get(f"{BASE_URL}/analytics/trends?hours=24")
    
    if response.status_code == 200:
        trends = response.json()
        print("✅ Analytics Retrieved!")
        print(f"Total Analyses: {trends.get('total_analyses', 0)}")
        print(f"Average Quality Score: {trends.get('average_quality_score', 0):.2f}")
        print(f"Most Common Language: {trends.get('most_common_language', 'N/A')}")
        return trends
    else:
        print(f"❌ Analytics Failed: {response.status_code}")
        return None

def test_export(result):
    """Test export functionality"""
    print("\n📤 Testing Export Functionality...")
    
    if not result:
        print("❌ No result to export")
        return
    
    formats = ['json', 'csv', 'markdown']
    
    for fmt in formats:
        try:
            response = requests.post(f"{BASE_URL}/export/{fmt}", json=result)
            if response.status_code == 200:
                print(f"✅ Export to {fmt.upper()} successful")
                export_data = response.json()
                # Save to file
                filename = f"analysis_export.{fmt}"
                with open(filename, 'w') as f:
                    f.write(export_data['data'])
                print(f"   Saved to {filename}")
            else:
                print(f"❌ Export to {fmt.upper()} failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Export to {fmt.upper()} error: {str(e)}")

def test_stats():
    """Test statistics endpoint"""
    print("\n📈 Testing Statistics...")
    
    response = requests.get(f"{BASE_URL}/stats")
    
    if response.status_code == 200:
        stats = response.json()
        print("✅ Statistics Retrieved!")
        print(f"Supported Languages: {stats.get('supported_languages', 0)}")
        print(f"Total Analyses: {stats.get('total_analyses', 0)}")
        print(f"Uptime: {stats.get('uptime', 'N/A')}")
        return stats
    else:
        print(f"❌ Statistics Failed: {response.status_code}")
        return None

def main():
    """Run all tests"""
    print("=" * 50)
    print("🧪 CodeAura Advanced Features Test Suite")
    print("=" * 50)
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now()}")
    print("=" * 50)
    
    # Test 1: Basic Analysis
    result = test_basic_analysis()
    
    # Test 2: Analytics
    test_analytics()
    
    # Test 3: Export
    test_export(result)
    
    # Test 4: Stats
    test_stats()
    
    print("\n" + "=" * 50)
    print("🎉 All tests completed!")
    print("=" * 50)

if __name__ == "__main__":
    main()
