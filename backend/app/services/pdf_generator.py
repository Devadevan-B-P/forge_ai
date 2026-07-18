import io
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfgen import canvas

def clean_text(text: str) -> str:
    if not text:
        return ""
    # Remove ASCII control characters except newline and tab (including U+0011 control characters)
    text = re.sub(r'[\x00-\x08\x0B-\x1F\x7F]', '', text)
    # Normalize unicode
    text = text.replace("–", "-")
    text = text.replace("—", "-")
    text = text.replace("•", "* ")
    # Replace single newlines with spaces, keeping double newlines as paragraph breaks
    text = text.replace("\r", "")
    paragraphs = text.split("\n\n")
    cleaned_paragraphs = []
    for p in paragraphs:
        cleaned_p = p.replace("\n", " ").strip()
        if cleaned_p:
            cleaned_paragraphs.append(cleaned_p)
    return "\n\n".join(cleaned_paragraphs)

class NumberedCanvas(canvas.Canvas):
    """Canvas that performs a two-pass render to print total page numbers dynamically in footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Draw Header
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b")) # slate-500
        self.drawString(50, 750, "Forge AI Software Architect | Product Requirements Document")
        
        self.setStrokeColor(colors.HexColor("#e2e8f0")) # slate-200
        self.setLineWidth(0.5)
        self.line(50, 742, 562, 742)
        
        # Draw Footer
        self.line(50, 60, 562, 60)
        self.drawString(50, 45, "Generated dynamically by Forge AI software architect solution.")
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(562, 45, page_str)
        
        self.restoreState()


def generate_pdf_report(blueprint: dict) -> bytes:
    buffer = io.BytesIO()
    
    # Page setup: letter size (8.5 x 11 inches is 612 x 792 points)
    # Margins: 50pt left/right, 60pt top/bottom
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=50,
        rightMargin=50,
        topMargin=60,
        bottomMargin=60
    )
    
    styles = getSampleStyleSheet()
    
    # Custom premium styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#7c3aed'),
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#7c3aed'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=18,  # Increased line height as requested
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    story = []
    
    # Document Header Title
    product_name = clean_text(blueprint.get("promptAnalysis", {}).get("projectName", "PRD Document"))
    story.append(Paragraph("PRODUCT SPECIFICATION & REQUIREMENTS (PRD)", subtitle_style))
    story.append(Paragraph(product_name, title_style))
    story.append(Paragraph("Generated dynamically by Forge AI software architect solution.", body_style))
    story.append(Spacer(1, 15))
    
    # 1. Prompt Analysis Section
    story.append(Paragraph("Prompt Analysis", h1_style))
    pa = blueprint.get("promptAnalysis", {})
    prompt_data = [
        [
            Paragraph("<b>INDUSTRY</b><br/>" + clean_text(pa.get("industry", "N/A")), body_style),
            Paragraph("<b>BUSINESS TYPE</b><br/>" + clean_text(pa.get("businessType", "N/A")), body_style),
            Paragraph("<b>COMPLEXITY</b><br/>" + clean_text(pa.get("complexity", "N/A")), body_style)
        ],
        [
            Paragraph("<b>EXPECTED USERS</b><br/>" + clean_text(pa.get("expectedUsers", "N/A")), body_style),
            Paragraph("<b>SCALE</b><br/>" + clean_text(pa.get("scale", "N/A")), body_style),
            Paragraph("<b>BUDGET</b><br/>" + clean_text(pa.get("budget", "N/A")), body_style)
        ],
        [
            Paragraph("<b>CLOUD PROVIDER</b><br/>" + clean_text(pa.get("cloudRequirements", "N/A")), body_style),
            Paragraph("<b>COMPLIANCE</b><br/>" + clean_text(pa.get("compliance", "N/A")), body_style),
            Paragraph("<b>TIMELINE</b><br/>" + clean_text(pa.get("estimatedTimeline", "N/A")), body_style)
        ]
    ]
    # Width calculation: 612 total width - 100 margins = 512 content width.
    # 512 / 3 = ~170 width per cell.
    t_prompt = Table(prompt_data, colWidths=[170, 170, 172])
    t_prompt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')), # slate-50
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#334155')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')), # slate-200
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')), # slate-300
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_prompt)
    story.append(Spacer(1, 15))
    
    # PRD Sections
    prd = blueprint.get("prd", {})
    
    # 2. Document Metadata
    story.append(Paragraph("1. Document Metadata", h1_style))
    dm = prd.get("documentMetadata", {})
    meta_data = [
        [
            Paragraph("<b>OWNERSHIP</b><br/>" + clean_text(dm.get("ownership", "N/A")), body_style),
            Paragraph("<b>DEPLOYMENT TARGET</b><br/>" + clean_text(dm.get("deploymentTarget", "N/A")), body_style),
            Paragraph("<b>VERSION STATUS</b><br/>" + clean_text(dm.get("versionStatus", "N/A")), body_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[170, 170, 172])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 15))
    
    # 3. Executive Summary
    story.append(Paragraph("2. Executive Summary & Objectives", h1_style))
    story.append(Paragraph(clean_text(prd.get("executiveSummary", "N/A")), body_style))
    story.append(Spacer(1, 10))
    
    # 4. User Stories
    story.append(Paragraph("3. User Stories", h1_style))
    user_stories = prd.get("userStories", [])
    if user_stories:
        for idx, story_item in enumerate(user_stories):
            persona = clean_text(story_item.get("persona", "User"))
            text = clean_text(story_item.get("story", ""))
            story.append(Paragraph(f"<b>{persona}</b>", h2_style))
            story.append(Paragraph(text, body_style))
    else:
        story.append(Paragraph("N/A", body_style))
    story.append(Spacer(1, 10))
    
    # 5. Business Rules
    story.append(Paragraph("4. Business Rules", h1_style))
    business_rules = prd.get("businessRules", [])
    if business_rules:
        for rule_item in business_rules:
            text = clean_text(rule_item.get("rule", ""))
            story.append(Paragraph(f"&bull; {text}", bullet_style))
    else:
        story.append(Paragraph("N/A", body_style))
    story.append(Spacer(1, 10))
    
    # 6. Acceptance Criteria
    story.append(Paragraph("5. Acceptance Criteria", h1_style))
    ac = prd.get("acceptanceCriteria", [])
    if ac:
        for criteria_item in ac:
            feature = clean_text(criteria_item.get("feature", ""))
            story.append(Paragraph(f"<b>{feature}</b>", h2_style))
            for crit in criteria_item.get("criteria", []):
                text = clean_text(crit)
                story.append(Paragraph(f"&bull; {text}", bullet_style))
    else:
        story.append(Paragraph("N/A", body_style))
    story.append(Spacer(1, 10))
    
    # 7. UX Design
    story.append(Paragraph("6. User Experience & Design Links", h1_style))
    ux = prd.get("uxDesign", {})
    story.append(Paragraph("<b>Interface Overview:</b>", h2_style))
    story.append(Paragraph(clean_text(ux.get("interfaceOverview", "N/A")), body_style))
    story.append(Paragraph("<b>Workspace Layout Description:</b>", h2_style))
    story.append(Paragraph(clean_text(ux.get("layoutDescription", "N/A")), body_style))
    story.append(Spacer(1, 10))
    
    # 8. Business Flow
    story.append(Paragraph("7. Business Flow", h1_style))
    bf = prd.get("businessFlow", [])
    if bf:
        for flow in bf:
            text = clean_text(flow)
            story.append(Paragraph(f"&bull; {text}", bullet_style))
    else:
        story.append(Paragraph("N/A", body_style))
    story.append(Spacer(1, 10))
    
    # 9. System Flow
    story.append(Paragraph("8. System Flow", h1_style))
    sf = prd.get("systemFlow", [])
    if sf:
        for flow in sf:
            text = clean_text(flow)
            story.append(Paragraph(f"&bull; {text}", bullet_style))
    else:
        story.append(Paragraph("N/A", body_style))
        
    doc.build(story, canvasmaker=NumberedCanvas)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
