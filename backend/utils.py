import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CodeAura")

def format_error_message(error: Exception) -> str:
    """Standardize error message formatting"""
    return f"Error: {str(error)}"

def log_analysis(code_preview: str):
    """Log that an analysis was requested"""
    logger.info(f"Analysis requested for code starting with: {code_preview[:50]}...")
