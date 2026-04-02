"""
PDF Report Generator for NPF Smart SITREP System
Generates professional PDF reports for daily, weekly, and other SITREP types
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from io import BytesIO
from datetime import datetime

# NPF Green color
NPF_GREEN = colors.HexColor('#006400')
NPF_LIGHT_GREEN = colors.HexColor('#90EE90')
NPF_DARK_GREEN = colors.HexColor('#004d00')

def get_styles():
    """Get custom styles for the PDF"""
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='NPFTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=NPF_DARK_GREEN,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    ))
    
    # Subtitle style
    styles.add(ParagraphStyle(
        name='NPFSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=NPF_GREEN,
        alignment=TA_CENTER,
        spaceAfter=30
    ))
    
    # Section header style
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=NPF_DARK_GREEN,
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    ))
    
    # Body text style
    styles.add(ParagraphStyle(
        name='NPFBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.black,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
        leading=14
    ))
    
    # Highlight style
    styles.add(ParagraphStyle(
        name='Highlight',
        parent=styles['Normal'],
        fontSize=10,
        textColor=NPF_DARK_GREEN,
        leftIndent=20,
        spaceAfter=6,
        bulletIndent=10
    ))
    
    return styles


def generate_daily_sitrep_pdf(sitrep_data: dict) -> BytesIO:
    """Generate PDF for daily SITREP report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm)
    styles = get_styles()
    story = []
    
    # Header
    story.append(Paragraph("NIGERIA POLICE FORCE", styles['NPFTitle']))
    story.append(Paragraph("DAILY INTELLIGENCE SITUATION REPORT", styles['NPFSubtitle']))
    story.append(Paragraph(f"Report Date: {sitrep_data.get('report_date', 'N/A')}", styles['NPFBody']))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['NPFBody']))
    story.append(Spacer(1, 20))
    
    # Executive Summary
    story.append(Paragraph("1. EXECUTIVE SUMMARY", styles['SectionHeader']))
    summary = sitrep_data.get('summary', {})
    summary_text = f"""
    Total Incidents: {summary.get('total_incidents', 0)}<br/>
    States Affected: {summary.get('states_affected', 0)}<br/>
    Critical Alerts: {summary.get('critical_count', 0)}<br/>
    High Priority: {summary.get('high_count', 0)}
    """
    story.append(Paragraph(summary_text, styles['NPFBody']))
    story.append(Spacer(1, 15))
    
    # Incident Summary Table
    story.append(Paragraph("2. INCIDENT SUMMARY", styles['SectionHeader']))
    incidents = sitrep_data.get('incident_summary', [])
    if incidents:
        table_data = [['Crime Type', 'Count', 'Severity Flag']]
        for incident in incidents:
            table_data.append([
                incident.get('crime_type', 'N/A'),
                str(incident.get('count', 0)),
                incident.get('severity_flag', 'GREEN')
            ])
        
        table = Table(table_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NPF_GREEN),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, NPF_GREEN),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))
        story.append(table)
    else:
        story.append(Paragraph("No incidents reported for this period.", styles['NPFBody']))
    story.append(Spacer(1, 15))
    
    # RED Alerts
    story.append(Paragraph("3. RED ALERTS (PRIORITY INCIDENTS)", styles['SectionHeader']))
    red_alerts = sitrep_data.get('top_5_red_alerts', [])
    if red_alerts:
        for idx, alert in enumerate(red_alerts, 1):
            alert_text = f"""
            <b>{idx}. {alert.get('threat', 'Unknown Threat')}</b><br/>
            State: {alert.get('state', 'N/A')} | 
            Severity: {alert.get('severity', 'N/A')} | 
            Action: {alert.get('recommended_action', 'Review and assess')}
            """
            story.append(Paragraph(alert_text, styles['Highlight']))
    else:
        story.append(Paragraph("No RED alerts for this period.", styles['NPFBody']))
    story.append(Spacer(1, 15))
    
    # State Risk Profiling
    story.append(Paragraph("4. STATE RISK PROFILING", styles['SectionHeader']))
    risk_profiles = sitrep_data.get('state_risk_profiling', [])
    if risk_profiles:
        table_data = [['State', 'Risk Rating', 'Dominant Crime', 'Trend']]
        for profile in risk_profiles[:10]:  # Top 10
            table_data.append([
                profile.get('state', 'N/A'),
                profile.get('risk_rating', 'GREEN'),
                profile.get('dominant_crime', 'N/A'),
                profile.get('trend', 'Stable')
            ])
        
        table = Table(table_data, colWidths=[1.5*inch, 1.2*inch, 2*inch, 1.3*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NPF_GREEN),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, NPF_GREEN),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ]))
        story.append(table)
    story.append(Spacer(1, 15))
    
    # Key Intelligence Highlights
    story.append(Paragraph("5. KEY INTELLIGENCE HIGHLIGHTS", styles['SectionHeader']))
    highlights = sitrep_data.get('key_intelligence_highlights', [])
    if highlights:
        for highlight in highlights:
            story.append(Paragraph(f"• {highlight}", styles['Highlight']))
    else:
        story.append(Paragraph("No significant intelligence highlights.", styles['NPFBody']))
    story.append(Spacer(1, 20))
    
    # Footer
    story.append(Paragraph("---", styles['NPFBody']))
    story.append(Paragraph("This report is classified and for official use only.", styles['NPFBody']))
    story.append(Paragraph("Nigeria Police Force - Smart SITREP System", styles['NPFBody']))
    
    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_weekly_sitrep_pdf(sitrep_data: dict) -> BytesIO:
    """Generate PDF for weekly SITREP report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm)
    styles = get_styles()
    story = []
    
    # Header
    story.append(Paragraph("NIGERIA POLICE FORCE", styles['NPFTitle']))
    story.append(Paragraph("WEEKLY INTELLIGENCE ASSESSMENT REPORT", styles['NPFSubtitle']))
    story.append(Paragraph(f"Week: {sitrep_data.get('week_start', 'N/A')} to {sitrep_data.get('week_end', 'N/A')}", styles['NPFBody']))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['NPFBody']))
    story.append(Spacer(1, 20))
    
    # Weekly Summary
    story.append(Paragraph("1. WEEKLY SUMMARY", styles['SectionHeader']))
    summary = sitrep_data.get('summary', {})
    summary_text = f"""
    Total Incidents This Week: {summary.get('total_incidents', 0)}<br/>
    States Affected: {summary.get('states_affected', 0)}<br/>
    Week-over-Week Change: {summary.get('wow_change', 'N/A')}%<br/>
    Most Active State: {summary.get('most_active_state', 'N/A')}
    """
    story.append(Paragraph(summary_text, styles['NPFBody']))
    story.append(Spacer(1, 15))
    
    # Threat Analysis
    story.append(Paragraph("2. THREAT ANALYSIS", styles['SectionHeader']))
    threats = sitrep_data.get('threat_analysis', [])
    if threats:
        table_data = [['Threat Type', 'Incidents', 'Trend', 'Risk Level']]
        for threat in threats:
            table_data.append([
                threat.get('threat_type', 'N/A'),
                str(threat.get('count', 0)),
                threat.get('trend', 'Stable'),
                threat.get('risk_level', 'Medium')
            ])
        
        table = Table(table_data, colWidths=[2*inch, 1.2*inch, 1.3*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NPF_GREEN),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, NPF_GREEN),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        story.append(table)
    story.append(Spacer(1, 15))
    
    # Recommendations
    story.append(Paragraph("3. STRATEGIC RECOMMENDATIONS", styles['SectionHeader']))
    recommendations = sitrep_data.get('recommendations', [])
    if recommendations:
        for rec in recommendations:
            story.append(Paragraph(f"• {rec}", styles['Highlight']))
    else:
        story.append(Paragraph("Continue standard monitoring protocols.", styles['NPFBody']))
    story.append(Spacer(1, 20))
    
    # Footer
    story.append(Paragraph("---", styles['NPFBody']))
    story.append(Paragraph("This report is classified and for official use only.", styles['NPFBody']))
    story.append(Paragraph("Nigeria Police Force - Smart SITREP System", styles['NPFBody']))
    
    doc.build(story)
    buffer.seek(0)
    return buffer
