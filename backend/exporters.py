"""
Export functionality for analysis results
"""
import json
import csv
from typing import Dict, List, Any
from datetime import datetime
import xml.etree.ElementTree as ET
from io import StringIO


class ExportManager:
    """Handle exporting analysis results in various formats"""
    
    @staticmethod
    def export_json(analysis_result: Dict[str, Any]) -> str:
        """Export as JSON"""
        export_data = {
            "export_timestamp": datetime.utcnow().isoformat(),
            "format": "CodeAura Analysis Report",
            "version": "2.0",
            "analysis": analysis_result
        }
        return json.dumps(export_data, indent=2)
    
    @staticmethod
    def export_csv(analysis_result: Dict[str, Any]) -> str:
        """Export as CSV"""
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Metric', 'Value'])
        
        # Basic info
        writer.writerow(['Complexity', analysis_result.get('complexity', 'N/A')])
        writer.writerow(['Issues Count', len(analysis_result.get('issues', []))])
        writer.writerow(['Language', analysis_result.get('language', 'N/A')])
        
        # Issues
        writer.writerow([])
        writer.writerow(['Issue', 'Description'])
        for issue in analysis_result.get('issues', []):
            writer.writerow(['Detected Issue', issue])
        
        return output.getvalue()
    
    @staticmethod
    def export_xml(analysis_result: Dict[str, Any]) -> str:
        """Export as XML"""
        root = ET.Element("CodeAuraAnalysis")
        root.set("timestamp", datetime.utcnow().isoformat())
        root.set("version", "2.0")
        
        # Analysis section
        analysis_elem = ET.SubElement(root, "Analysis")
        
        complexity_elem = ET.SubElement(analysis_elem, "Complexity")
        complexity_elem.text = analysis_result.get('complexity', 'N/A')
        
        issues_elem = ET.SubElement(analysis_elem, "Issues")
        issues_elem.set("count", str(len(analysis_result.get('issues', []))))
        
        for issue in analysis_result.get('issues', []):
            issue_elem = ET.SubElement(issues_elem, "Issue")
            issue_elem.text = issue
        
        explanation_elem = ET.SubElement(analysis_elem, "Explanation")
        explanation_elem.text = analysis_result.get('explanation', '')
        
        # Convert to string
        return ET.tostring(root, encoding='unicode')
    
    @staticmethod
    def export_markdown(analysis_result: Dict[str, Any]) -> str:
        """Export as Markdown"""
        md_content = []
        md_content.append("# CodeAura Analysis Report")
        md_content.append(f"*Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}*")
        md_content.append("")
        
        # Summary
        md_content.append("## Summary")
        md_content.append(f"- **Complexity**: `{analysis_result.get('complexity', 'N/A')}`")
        md_content.append(f"- **Issues Found**: {len(analysis_result.get('issues', []))}")
        md_content.append(f"- **AI Provider**: {analysis_result.get('ai_provider', 'N/A')}")
        md_content.append("")
        
        # Issues
        if analysis_result.get('issues'):
            md_content.append("## Issues Detected")
            for i, issue in enumerate(analysis_result['issues'], 1):
                md_content.append(f"{i}. {issue}")
        else:
            md_content.append("## ✅ No Issues Found")
        md_content.append("")
        
        # Explanation
        md_content.append("## AI Explanation")
        explanation = analysis_result.get('explanation', 'No explanation available.')
        md_content.append(f"```\n{explanation}\n```")
        md_content.append("")
        
        # Improved Code
        if 'improved_code' in analysis_result:
            md_content.append("## Suggested Improvements")
            md_content.append("```" + analysis_result.get('language', ''))
            md_content.append(analysis_result['improved_code'])
            md_content.append("```")
        
        return "\n".join(md_content)
    
    @staticmethod
    def export_pdf(analysis_result: Dict[str, Any]) -> bytes:
        """Export as PDF (placeholder - would require weasyprint or similar)"""
        # This would require additional dependencies like weasyprint
        # For now, return markdown as bytes
        markdown_content = ExportManager.export_markdown(analysis_result)
        return markdown_content.encode('utf-8')
    
    @staticmethod
    def get_export_formats() -> List[str]:
        """Get list of supported export formats"""
        return ['json', 'csv', 'xml', 'markdown', 'pdf']


# Convenience functions
def export_analysis(analysis_result: Dict[str, Any], format_type: str) -> str:
    """Export analysis result in specified format"""
    exporter = ExportManager()
    
    format_map = {
        'json': exporter.export_json,
        'csv': exporter.export_csv,
        'xml': exporter.export_xml,
        'markdown': exporter.export_markdown,
        'pdf': lambda x: exporter.export_pdf(x).decode('utf-8')
    }
    
    if format_type.lower() not in format_map:
        raise ValueError(f"Unsupported format: {format_type}")
    
    return format_map[format_type.lower()](analysis_result)
