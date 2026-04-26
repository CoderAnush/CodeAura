"""
Pytest configuration for CodeAura tests
"""
import pytest
import os

# Set test environment
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["APP_ENV"] = "test"
