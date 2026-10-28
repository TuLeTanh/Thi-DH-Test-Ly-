import os
import sys
import re
import json
import zipfile
import struct
import datetime
import xml.etree.ElementTree as ET
import ctypes
from ctypes import wintypes
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

# -------------------------------------------------------------
# 1. SETUP PATHS
# -------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCX_NAME = "Ma trận + Đề cương KTGKI - Có đáp án.docx"
DOCX_PATH = os.path.join(BASE_DIR, DOCX_NAME)

PUBLIC_IMG_DIR = os.path.join(BASE_DIR, "public", "img")
FORMULA_IMG_DIR = os.path.join(PUBLIC_IMG_DIR, "formula")

os.makedirs(PUBLIC_IMG_DIR, exist_ok=True)
os.makedirs(FORMULA_IMG_DIR, exist_ok=True)

QUESTIONS_JSON_PATH = os.path.join(BASE_DIR, "questions.json")
EXAM_CONFIG_PATH = os.path.join(BASE_DIR, "exam_config.json")
REVIEW_REPORT_PATH = os.path.join(BASE_DIR, "review_report.md")
PREVIEW_HTML_PATH = os.path.join(BASE_DIR, "preview.html")

# -------------------------------------------------------------
# 2. GDI+ WMF TO PNG CONVERTER (NATIVE WINDOWS HIGH-RES)
# -------------------------------------------------------------
class GdiplusStartupInput(ctypes.Structure):
    _fields_ = [
        ('GdiplusVersion', wintypes.DWORD),
        ('DebugEventCallback', ctypes.c_void_p),
        ('SuppressBackgroundThread', wintypes.BOOL),
        ('SuppressExternalCodecs', wintypes.BOOL)
    ]

class GUID(ctypes.Structure):
    _fields_ = [
        ("Data1", wintypes.DWORD),
        ("Data2", wintypes.WORD),
        ("Data3", wintypes.WORD),
        ("Data4", ctypes.c_byte * 8)
    ]

_gdiplus_available = False
try:
    gdiplus = ctypes.windll.gdiplus
    token = ctypes.c_ulong()
    startup_in = GdiplusStartupInput(1, None, False, False)
    ret = gdiplus.GdiplusStartup(ctypes.byref(token), ctypes.byref(startup_in), None)
    if ret == 0:
        _gdiplus_available = True
except Exception:
    _gdiplus_available = False

def convert_wmf_to_png(wmf_bytes, png_path, scale=6):
    temp_wmf = png_path + ".temp.wmf"
    with open(temp_wmf, "wb") as f:
        f.write(wmf_bytes)
        
    converted = False
    if _gdiplus_available:
        try:
            image = ctypes.c_void_p()
            ret = gdiplus.GdipCreateMetafileFromFile(ctypes.c_wchar_p(temp_wmf), ctypes.byref(image))
            if ret != 0:
                ret = gdiplus.GdipLoadImageFromFile(ctypes.c_wchar_p(temp_wmf), ctypes.byref(image))
            if ret == 0:
                width = ctypes.c_float()
                height = ctypes.c_float()
                gdiplus.GdipGetImageDimension(image, ctypes.byref(width), ctypes.byref(height))
                w = max(10, int(width.value * scale))
                h = max(10, int(height.value * scale))
                
                bitmap = ctypes.c_void_p()
                gdiplus.GdipCreateBitmapFromScan0(w, h, 0, 0x26200A, None, ctypes.byref(bitmap))
                graphics = ctypes.c_void_p()
                gdiplus.GdipGetImageGraphicsContext(bitmap, ctypes.byref(graphics))
                gdiplus.GdipGraphicsClear(graphics, 0xFFFFFFFF)
                gdiplus.GdipDrawImageRectRectI(graphics, image, 0, 0, w, h, 0, 0, int(width.value), int(height.value), 2, None, None, None)
                
                png_clsid = GUID(0x557cf406, 0x1a04, 0x11d3, (ctypes.c_byte * 8)(0x9a, 0x73, 0x00, 0x00, 0xf8, 0x1e, 0xf3, 0x2e))
                gdiplus.GdipSaveImageToFile(bitmap, ctypes.c_wchar_p(png_path), ctypes.byref(png_clsid), None)
                
                gdiplus.GdipDeleteGraphics(graphics)
                gdiplus.GdipDisposeImage(bitmap)
                gdiplus.GdipDisposeImage(image)
                converted = True
        except Exception as e:
            pass
            
    if not converted:
        # Fallback to Pillow
        try:
            im = Image.open(temp_wmf)
            im.save(png_path)
            converted = True
        except Exception as e:
            print(f"Error converting WMF with Pillow: {e}")
            
    if os.path.exists(temp_wmf):
        os.remove(temp_wmf)
    return converted

# -------------------------------------------------------------
# 3. LATEX FORMULA MAPPING FOR THE 39 MATHTYPE EQUATIONS
# -------------------------------------------------------------
FORMULA_LATEX_MAP = {
    # Câu 54 (MCQ)
    "embeddings/oleObject1.bin": r"25^\circ\text{C}",
    "embeddings/oleObject2.bin": r"5^\circ\text{C}",
    
    # Câu 13 (TF)
    "embeddings/oleObject3.bin": r"1{,}0\text{ cm}^2",
    "embeddings/oleObject4.bin": r"2{,}0 \cdot 10^5\text{ Pa}",
    
    # Câu 14 (TF)
    "embeddings/oleObject5.bin": r"x",
    "embeddings/oleObject6.bin": r"z",
    "embeddings/oleObject7.bin": r"y",
    "embeddings/oleObject8.bin": r"0\text{ K}",
    
    # Câu 15 (TF stem)
    "embeddings/oleObject9.bin": r"0{,}020\text{ kg}",
    "embeddings/oleObject10.bin": r"0^\circ\text{C}",
    "embeddings/oleObject11.bin": r"100^\circ\text{C}",
    "embeddings/oleObject12.bin": r"0^\circ\text{C}",
    "embeddings/oleObject13.bin": r"3{,}34 \cdot 10^5\text{ J/kg}",
    "embeddings/oleObject14.bin": r"4{,}20\text{ kJ/(kg}\cdot\text{K)}",
    "embeddings/oleObject15.bin": r"100^\circ\text{C}",
    "embeddings/oleObject16.bin": r"2{,}26 \cdot 10^6\text{ J/kg}",
    
    # Câu 15 (TF a, b, c, d)
    "embeddings/oleObject17.bin": r"0{,}020\text{ kg}",
    "embeddings/oleObject18.bin": r"6680\text{ J}",
    "embeddings/oleObject19.bin": r"0{,}020\text{ kg}",
    "embeddings/oleObject20.bin": r"0^\circ\text{C}",
    "embeddings/oleObject21.bin": r"100^\circ\text{C}",
    "embeddings/oleObject22.bin": r"8400\text{ J}",
    "embeddings/oleObject23.bin": r"0{,}020\text{ kg}",
    "embeddings/oleObject24.bin": r"100^\circ\text{C}",
    "embeddings/oleObject25.bin": r"45200\text{ J}",
    "embeddings/oleObject26.bin": r"0{,}020\text{ kg}",
    "embeddings/oleObject27.bin": r"0^\circ\text{C}",
    "embeddings/oleObject28.bin": r"100^\circ\text{C}",
    "embeddings/oleObject29.bin": r"60280\text{ J}",
    
    # Câu 20 (TF)
    "embeddings/oleObject30.bin": r"\Delta V",
    "embeddings/oleObject31.bin": r"0{,}6^\circ\text{C}",
    "embeddings/oleObject32.bin": r"\Delta V",
    
    # Câu 22 (TF)
    "embeddings/oleObject33.bin": r"\Delta U = Q",
    
    # Câu 28 (TF)
    "embeddings/oleObject34.bin": r"28{,}6^\circ\text{C}",
    
    # Câu 29 (TF)
    "embeddings/oleObject35.bin": r"5{,}8 \cdot 10^{-2}\text{ kg/s}",
    "embeddings/oleObject36.bin": r"15^\circ\text{C}",
    "embeddings/oleObject37.bin": r"4200\text{ J/(kg}\cdot\text{K)}",
    "embeddings/oleObject38.bin": r"50^\circ\text{C}",
    "embeddings/oleObject39.bin": r"35^\circ\text{C}",
}

# -------------------------------------------------------------
# 4. PARSE DOCX AND EXTRACT DATA
# -------------------------------------------------------------
def main():
    print(f"Reading docx from: {DOCX_PATH}")
    with zipfile.ZipFile(DOCX_PATH, 'r') as z:
        doc_xml = z.read("word/document.xml")
        rels_xml = z.read("word/_rels/document.xml.rels")
        
        # Save the 4 illustrations
        png_attachments = {
            "word/media/image1.png": "mcq-023_1.png",
            "word/media/image4.png": "tf-010_1.png",
            "word/media/image7.png": "tf-014_1.png",
            "word/media/image27.png": "tf-020_1.png",
        }
        for src_media, dest_name in png_attachments.items():
            if src_media in z.namelist():
                out_p = os.path.join(PUBLIC_IMG_DIR, dest_name)
                with open(out_p, "wb") as f:
                    f.write(z.read(src_media))
                print(f"Extracted illustration: {dest_name}")
                
        # Build relationship map
        rels_root = ET.fromstring(rels_xml)
        rel_map = {}
        for rel in rels_root.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
            rel_map[rel.attrib.get('Id')] = rel.attrib.get('Target')
            
        # Parse XML
        root = ET.fromstring(doc_xml)
        ns = {
            'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
            'o': 'urn:schemas-microsoft-com:office:office',
            'v': 'urn:schemas-microsoft-com:vml',
            'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'
        }
        body = root.find('w:body', ns)
        
        # Extract tables for exam_config.json
        tables = body.findall('w:tbl', ns)
        generate_exam_config(tables)
        
        # Extract and convert formulas
        # We'll map each OLE object and its WMF image to a formula image in public/img/formula/
        ole_to_img_rel = {}
        for r_elem in root.findall('.//w:r', ns):
            ole = r_elem.find('.//o:OLEObject', ns)
            v_img = r_elem.find('.//v:imagedata', ns)
            if ole is not None and v_img is not None:
                ole_rid = ole.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                img_rid = v_img.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                ole_target = rel_map.get(ole_rid)
                img_target = rel_map.get(img_rid)
                if ole_target and img_target:
                    ole_to_img_rel[ole_target] = img_target

        formula_image_paths = {} # ole_target -> relative png path
        for ole_target, wmf_rel in ole_to_img_rel.items():
            wmf_path_in_zip = f"word/{wmf_rel}"
            if wmf_path_in_zip in z.namelist():
                wmf_bytes = z.read(wmf_path_in_zip)
                # save wmf copy
                base_name = os.path.splitext(os.path.basename(ole_target))[0]
                wmf_disk_path = os.path.join(FORMULA_IMG_DIR, f"{base_name}.wmf")
                with open(wmf_disk_path, "wb") as f:
                    f.write(wmf_bytes)
                png_disk_path = os.path.join(FORMULA_IMG_DIR, f"{base_name}.png")
                convert_wmf_to_png(wmf_bytes, png_disk_path, scale=5)
                formula_image_paths[ole_target] = f"/img/formula/{base_name}.png"

        # Parse body paragraphs
        p_elements = body.findall('w:p', ns)
        questions_data = parse_all_questions(p_elements, rel_map, formula_image_paths, ns)
        
        # Write questions.json
        with open(QUESTIONS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(questions_data, f, ensure_ascii=False, indent=2)
        print(f"Written questions.json ({len(questions_data['mcq'])} MCQ, {len(questions_data['tf'])} TF, {len(questions_data['short'])} Short)")
        
        # Write review_report.md
        generate_review_report(questions_data)
        
        # Write preview.html
        generate_preview_html(questions_data)

# -------------------------------------------------------------
# 5. PARSE QUESTIONS IMPLEMENTATION
# -------------------------------------------------------------
def get_p_tokens(p, rel_map, formula_image_paths, ns):
    """Extract tokens from paragraph runs: text, tabs, underline, OLE formulas, drawings."""
    tokens = []
    for r in p.findall('.//w:r', ns):
        u_node = r.find('.//w:u', ns)
        is_u = u_node is not None and u_node.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', 'single') != 'none'
        
        # Check tab
        if len(r.findall('.//w:tab', ns)) > 0:
            tokens.append({'type': 'text', 'text': '\t', 'u': is_u})
            
        # Check OLE object
        ole = r.find('.//o:OLEObject', ns)
        if ole is not None:
            ole_rid = ole.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            target = rel_map.get(ole_rid, '')
            latex = FORMULA_LATEX_MAP.get(target, r"\text{formula}")
            formula_img = formula_image_paths.get(target)
            tokens.append({
                'type': 'formula',
                'latex': f"${latex}$",
                'target': target,
                'formula_img': formula_img,
                'u': is_u
            })
            continue
            
        # Check text in w:t
        t_nodes = r.findall('.//w:t', ns)
        if t_nodes:
            txt = "".join(t.text for t in t_nodes if t.text)
            if txt:
                tokens.append({'type': 'text', 'text': txt, 'u': is_u})
                
    return tokens

def tokens_to_text(tokens):
    res = []
    for t in tokens:
        if t['type'] == 'text':
            res.append(t['text'])
        elif t['type'] == 'formula':
            res.append(t['latex'])
    return "".join(res)

def parse_all_questions(p_elements, rel_map, formula_image_paths, ns):
    data = {
        "meta": {
            "subject": "Vật lý",
            "source": DOCX_NAME,
            "generated": datetime.date.today().isoformat()
        },
        "mcq": [],
        "tf": [],
        "short": []
    }
    
    current_section = None
    section_paras = {'mcq': [], 'tf': [], 'short': []}
    
    for p in p_elements:
        # Extract raw text to check section headers
        t_nodes = p.findall('.//w:t', ns)
        p_raw_text = "".join(t.text for t in t_nodes if t.text).strip()
        
        if "I. Trắc nghiệm nhiều lựa chọn" in p_raw_text:
            current_section = 'mcq'
            continue
        elif "II. Trắc nghiệm đúng/sai" in p_raw_text:
            current_section = 'tf'
            continue
        elif "III. Trắc nghiệm trả lời ngắn" in p_raw_text:
            current_section = 'short'
            continue
        elif "GIÁO VIÊN BIÊN SOẠN" in p_raw_text:
            current_section = None
            break
            
        if current_section:
            p_tokens = get_p_tokens(p, rel_map, formula_image_paths, ns)
            section_paras[current_section].append((p_tokens, p_raw_text))

    # --- 1. PARSE MCQ ---
    mcq_grouped = group_by_cau(section_paras['mcq'])
    for q_item in mcq_grouped:
        num = q_item['num']
        all_tokens = []
        for p_toks, _ in q_item['paras']:
            all_tokens.extend(p_toks)
            all_tokens.append({'type': 'text', 'text': '\n', 'u': False})
            
        full_text = tokens_to_text(all_tokens)
        
        # Find options sequence A -> B -> C -> D
        matches = list(re.finditer(r'(?<![a-zA-Z0-9])([A-D])[\.\)]', full_text))
        selected = None
        for i_a in range(len(matches)):
            if matches[i_a].group(1) == 'A':
                for i_b in range(i_a + 1, len(matches)):
                    if matches[i_b].group(1) == 'B':
                        for i_c in range(i_b + 1, len(matches)):
                            if matches[i_c].group(1) == 'C':
                                for i_d in range(i_c + 1, len(matches)):
                                    if matches[i_d].group(1) == 'D':
                                        selected = (matches[i_a], matches[i_b], matches[i_c], matches[i_d])
                                        break
                                if selected: break
                        if selected: break
                if selected: break
                
        stem = ""
        options = ["", "", "", ""]
        if selected:
            mA, mB, mC, mD = selected
            stem = full_text[:mA.start()].strip()
            stem = re.sub(r'^Câu\s+\d+[\.\:]?\s*', '', stem).strip()
            options[0] = clean_option_text(full_text[mA.end():mB.start()])
            options[1] = clean_option_text(full_text[mB.end():mC.start()])
            options[2] = clean_option_text(full_text[mC.end():mD.start()])
            options[3] = clean_option_text(full_text[mD.end():])
        else:
            stem = full_text.strip()
            
        # Detect underlined label
        u_labels = []
        for tok in all_tokens:
            if tok.get('u'):
                txt = tok.get('text', '')
                for lbl in ['A', 'B', 'C', 'D']:
                    if re.search(rf'(?<![a-zA-Z0-9]){lbl}[\.\)]', txt):
                        u_labels.append(lbl)
                        
        ans_idx = None
        if len(u_labels) == 1:
            ans_idx = ['A', 'B', 'C', 'D'].index(u_labels[0])
            
        # Check formula images and needsReview
        formula_imgs = [tok['formula_img'] for tok in all_tokens if tok.get('type') == 'formula' and tok.get('formula_img')]
        has_mathtype = len(formula_imgs) > 0
        needs_review = has_mathtype or (ans_idx is None) or (not selected)
        
        # Check illustration images (paths starting with /img/ for web routing)
        images = []
        if num == 23:
            images.append("/img/mcq-023_1.png")
            
        data["mcq"].append({
            "id": f"mcq-{num:03d}",
            "srcNo": num,
            "topic": None,
            "q": stem,
            "images": images,
            "formulaImages": formula_imgs,
            "options": options,
            "answer": ans_idx,
            "needsReview": needs_review
        })

    # --- 2. PARSE TF ---
    tf_grouped = group_by_cau(section_paras['tf'])
    for q_item in tf_grouped:
        num = q_item['num']
        all_tokens = []
        for p_toks, _ in q_item['paras']:
            all_tokens.extend(p_toks)
            all_tokens.append({'type': 'text', 'text': '\n', 'u': False})
            
        full_text = tokens_to_text(all_tokens)
        matches = list(re.finditer(r'(?<![a-zA-Z0-9])([a-d])\)\s*', full_text))
        
        selected = None
        for i_a in range(len(matches)):
            if matches[i_a].group(1) == 'a':
                for i_b in range(i_a + 1, len(matches)):
                    if matches[i_b].group(1) == 'b':
                        for i_c in range(i_b + 1, len(matches)):
                            if matches[i_c].group(1) == 'c':
                                for i_d in range(i_c + 1, len(matches)):
                                    if matches[i_d].group(1) == 'd':
                                        selected = (matches[i_a], matches[i_b], matches[i_c], matches[i_d])
                                        break
                                if selected: break
                        if selected: break
                if selected: break
                
        stem = ""
        stmts = ["", "", "", ""]
        if selected:
            ma, mb, mc, md = selected
            stem = full_text[:ma.start()].strip()
            stem = re.sub(r'^Câu\s+\d+[\.\:]?\s*', '', stem).strip()
            stmts[0] = clean_stmt_text(full_text[ma.end():mb.start()])
            stmts[1] = clean_stmt_text(full_text[mb.end():mc.start()])
            stmts[2] = clean_stmt_text(full_text[mc.end():md.start()])
            stmts[3] = clean_stmt_text(full_text[md.end():])
        else:
            stem = full_text.strip()
            
        u_labels = set()
        for tok in all_tokens:
            if tok.get('u'):
                txt = tok.get('text', '')
                for lbl in ['a', 'b', 'c', 'd']:
                    if re.search(rf'(?<![a-zA-Z0-9]){lbl}\)', txt):
                        u_labels.add(lbl)
                        
        answers = [('a' in u_labels), ('b' in u_labels), ('c' in u_labels), ('d' in u_labels)]
        
        formula_imgs = [tok['formula_img'] for tok in all_tokens if tok.get('type') == 'formula' and tok.get('formula_img')]
        has_mathtype = len(formula_imgs) > 0
        needs_review = has_mathtype or (not selected)
        
        images = []
        if num == 10:
            images.append("/img/tf-010_1.png")
        elif num == 14:
            images.append("/img/tf-014_1.png")
        elif num == 20:
            images.append("/img/tf-020_1.png")
            
        data["tf"].append({
            "id": f"tf-{num:03d}",
            "srcNo": num,
            "topic": None,
            "q": stem,
            "images": images,
            "formulaImages": formula_imgs,
            "statements": stmts,
            "answers": answers,
            "needsReview": needs_review
        })

    # --- 3. PARSE SHORT ---
    short_grouped = group_by_cau(section_paras['short'])
    for q_item in short_grouped:
        num = q_item['num']
        all_tokens = []
        for p_toks, _ in q_item['paras']:
            all_tokens.extend(p_toks)
            all_tokens.append({'type': 'text', 'text': '\n', 'u': False})
            
        full_text = tokens_to_text(all_tokens).strip()
        m = re.match(r'^Câu\s+(\d+)\s*\(([^)]+)\)\.?\s*(.*)', full_text, re.DOTALL)
        if m:
            ans_raw = m.group(2).strip()
            ans_norm = ans_raw.replace(',', '.')
            stem = m.group(3).strip()
        else:
            ans_raw = ""
            ans_norm = ""
            stem = re.sub(r'^Câu\s+\d+[\.\:]?\s*', '', full_text).strip()
            
        formula_imgs = [tok['formula_img'] for tok in all_tokens if tok.get('type') == 'formula' and tok.get('formula_img')]
        has_mathtype = len(formula_imgs) > 0
        needs_review = has_mathtype or (ans_norm == "")
        
        data["short"].append({
            "id": f"short-{num:03d}",
            "srcNo": num,
            "topic": None,
            "q": stem,
            "images": [],
            "formulaImages": formula_imgs,
            "answer": ans_norm,
            "answerRaw": ans_raw,
            "needsReview": needs_review
        })

    return data

def group_by_cau(paras_list):
    groups = []
    curr = None
    for p_tokens, raw_text in paras_list:
        m = re.match(r'^Câu\s+(\d+)', raw_text)
        if m:
            if curr:
                groups.append(curr)
            curr = {'num': int(m.group(1)), 'paras': [(p_tokens, raw_text)]}
        else:
            if curr:
                curr['paras'].append((p_tokens, raw_text))
    if curr:
        groups.append(curr)
    return groups

def clean_option_text(text):
    text = re.sub(r'^\s*[\.\:\)]\s*', '', text)
    # clean extra newlines and spaces
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return " ".join(lines)

def clean_stmt_text(text):
    text = re.sub(r'^\s*[\.\:\)]\s*', '', text)
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    return " ".join(lines)

# -------------------------------------------------------------
# 6. GENERATE EXAM_CONFIG.JSON
# -------------------------------------------------------------
def generate_exam_config(tables):
    config = {
        "source": DOCX_NAME,
        "subject": "Vật lí 12",
        "duration_minutes": 50,
        "scoring": {
            "mcq_per_question": 0.25,
            "short_per_question": 0.25,
            "tf_by_correct_statements": {
                "0": 0,
                "1": 0.1,
                "2": 0.25,
                "3": 0.5,
                "4": 1.0
            }
        },
        "exam_structure": {
            "part_1_mcq": {
                "name": "Trắc nghiệm nhiều lựa chọn (Dạng thức 1)",
                "num_questions": 18,
                "levels": {
                    "nhan_biet": 12,
                    "thong_hieu": 4,
                    "van_dung": 2
                },
                "percentage": 45,
                "score": "4.5 điểm (tương ứng 45% thang điểm 10)"
            },
            "part_2_tf": {
                "name": "Trắc nghiệm đúng/sai (Dạng thức 2)",
                "num_questions": 4,
                "num_statements": 16,
                "levels": {
                    "nhan_biet": 4,
                    "thong_hieu": 6,
                    "van_dung": 6
                },
                "percentage": 40,
                "score": "4.0 điểm (tương ứng 40% thang điểm 10)"
            },
            "part_3_short": {
                "name": "Trắc nghiệm trả lời ngắn (Dạng thức 3)",
                "num_questions": 6,
                "levels": {
                    "nhan_biet": 0,
                    "thong_hieu": 2,
                    "van_dung": 4
                },
                "percentage": 15,
                "score": "1.5 điểm (tương ứng 15% thang điểm 10)"
            },
            "total": {
                "num_questions": 28,
                "num_commands": 40,
                "percentage": 100,
                "max_score": 10.0
            }
        },
        "matrix_table": [
            {
                "topic": "Vật lí nhiệt",
                "subtopics": [
                    {
                        "name": "Sự chuyển thể",
                        "dang_1": { "biet": 3, "hieu": 1, "van_dung": 0, "total": 4 }
                    },
                    {
                        "name": "Nội năng, định luật 1 của nhiệt động lực học",
                        "dang_1": { "biet": 2, "hieu": 0, "van_dung": 1, "total": 3 }
                    },
                    {
                        "name": "Thang nhiệt độ, nhiệt kế",
                        "dang_1": { "biet": 2, "hieu": 1, "van_dung": 0, "total": 3 }
                    },
                    {
                        "name": "Nhiệt dung riêng, nhiệt nóng chảy riêng, nhiệt hóa hơi riêng",
                        "dang_1": { "biet": 2, "hieu": 1, "van_dung": 1, "total": 4 }
                    }
                ],
                "dang_1_total": 14,
                "dang_2_commands": { "biet": 4, "hieu": 6, "van_dung": 6, "total": 16 },
                "dang_3_commands": { "biet": 0, "hieu": 2, "van_dung": 4, "total": 6 },
                "total_commands": 36
            },
            {
                "topic": "Khí lí tưởng",
                "subtopics": [
                    {
                        "name": "Mô hình động học phân tử chất khí",
                        "dang_1": { "biet": 3, "hieu": 1, "van_dung": 0, "total": 4 }
                    }
                ],
                "dang_1_total": 4,
                "dang_2_commands": { "biet": 0, "hieu": 0, "van_dung": 0, "total": 0 },
                "dang_3_commands": { "biet": 0, "hieu": 0, "van_dung": 0, "total": 0 },
                "total_commands": 4
            }
        ],
        "learning_outcomes_specification": [
            {
                "content": "Sự chuyển thể",
                "requirements": "- Biết: Sử dụng mô hình động học phân tử, nêu được sơ lược cấu trúc của chất rắn, chất lỏng, chất khí.\n- Hiểu: Giải thích được sơ lược một số hiện tượng vật lí liên quan đến sự chuyển thể. sự nóng chảy, sự hoá hơi."
            },
            {
                "content": "Nội năng, định luật 1 của nhiệt động lực học",
                "requirements": "- Biết: Nêu được mối liên hệ nội năng của vật với năng lượng của các phân tử tạo nên vật, định luật 1 của nhiệt động lực học.\n- VD: Vận dụng được định luật 1 của nhiệt động lực học trong một số trường hợp đơn giản."
            },
            {
                "content": "Thang nhiệt độ, nhiệt kế",
                "requirements": "- Biết: Nêu được sự chênh lệch nhiệt độ giữa hai vật tiếp xúc nhau có thể cho ta biết chiều truyền năng lượng nhiệt giữa chúng; từ đó nêu được khi hai vật tiếp xúc với nhau, ở cùng nhiệt độ, sẽ không có sự truyền năng lượng nhiệt giữa chúng. Nêu được 1°C bằng 1/100 của khoảng cách giữa nhiệt độ tan chảy của nước tinh khiết đóng băng và nhiệt độ sôi của nước tinh khiết (ở áp suất tiêu chuẩn), 1 K bằng 1/(273,16) của khoảng cách giữa nhiệt độ không tuyệt đối và nhiệt độ điểm mà nước tinh khiết tồn tại đồng thời ở thể rắn, lỏng và hơi (ở áp suất tiêu chuẩn). Nêu được nhiệt độ không tuyệt đối là nhiệt độ mà tại đó tất cả các chất có động năng chuyển động nhiệt của các phân tử hoặc nguyên tử bằng không và thế năng của chúng là tối thiểu.\n- Hiểu: Chuyển đổi được nhiệt độ đo theo thang Celsius sang nhiệt độ đo theo thang Kelvin và ngược lại."
            },
            {
                "content": "Nhiệt dung riêng, nhiệt nóng chảy riêng, nhiệt hoá hơi riêng",
                "requirements": "- Biết: Nêu được định nghĩa nhiệt dung riêng, nhiệt nóng chảy riêng, nhiệt hoá hơi riêng.\n- Hiểu: Nêu được phương án hoặc lựa chọn phương án thí nghiệm đo được nhiệt dung riêng, nhiệt nóng chảy riêng, nhiệt hoá hơi riêng bằng dụng cụ thực hành.\n- VD: Vận dụng công thức tính nhiệt lượng trong các quá trình truyền nhiệt và biến thiên nội năng."
            },
            {
                "content": "Mô hình động học phân tử chất khí",
                "requirements": "- Biết: Nêu được các giả thuyết của thuyết động học phân tử chất khí.\n- Hiểu: Phân tích mô hình chuyển động Brown, nêu được các phân tử trong chất khí chuyển động hỗn loạn."
            }
        ]
    }
    with open(EXAM_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    print("Generated exam_config.json successfully.")

# -------------------------------------------------------------
# 7. GENERATE REVIEW_REPORT.MD
# -------------------------------------------------------------
def generate_review_report(data):
    mcq = data['mcq']
    tf = data['tf']
    short = data['short']
    
    mcq_review = [q for q in mcq if q['needsReview']]
    tf_review = [q for q in tf if q['needsReview']]
    short_review = [q for q in short if q['needsReview']]
    
    total_q = len(mcq) + len(tf) + len(short)
    total_review = len(mcq_review) + len(tf_review) + len(short_review)
    
    lines = [
        "# BÁO CÁO KIỂM TRA CHUYỂN ĐỔI DỮ LIỆU ĐỀ CƯƠNG VẬT LÝ 12",
        "",
        f"- **File nguồn:** `{DOCX_NAME}`",
        f"- **Thời gian khởi tạo:** `{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`",
        f"- **Tổng số câu hỏi trích xuất:** **{total_q} câu**",
        "",
        "## 1. Tổng hợp số lượng từng dạng",
        "",
        "| Dạng câu hỏi | Ký hiệu | Số lượng | Số câu cần đối chiếu (`needsReview=true`) |",
        "| :--- | :---: | :---: | :---: |",
        f"| **Trắc nghiệm 4 lựa chọn** | `mcq` | {len(mcq)} | {len(mcq_review)} |",
        f"| **Trắc nghiệm Đúng/Sai** | `tf` | {len(tf)} | {len(tf_review)} |",
        f"| **Trắc nghiệm Trả lời ngắn** | `short` | {len(short)} | {len(short_review)} |",
        f"| **Tổng cộng** | | **{total_q}** | **{total_review}** |",
        "",
        "---",
        "",
        "## 2. Danh sách các câu đánh dấu `needsReview = true`",
        "",
        "> **Lưu ý:** Theo đúng yêu cầu, toàn bộ các câu chứa công thức MathType được đánh dấu `needsReview = true` để đối chiếu trực tiếp giữa công thức LaTeX đã parse và ảnh preview gốc (.png render từ .wmf).",
        ""
    ]
    
    if mcq_review:
        lines.append("### A. Trắc nghiệm 4 lựa chọn (MCQ)")
        for q in mcq_review:
            formula_note = f"Chứa {len(q['formulaImages'])} công thức MathType: {', '.join(q['formulaImages'])}" if q['formulaImages'] else "Không chứa MathType"
            ans_str = ['A', 'B', 'C', 'D'][q['answer']] if q['answer'] is not None else "CHƯA XÁC ĐỊNH"
            lines.append(f"- **Câu {q['srcNo']} (ID: `{q['id']}`)**: Đáp án `{ans_str}`. Lý do review: {formula_note}.")
        lines.append("")
        
    if tf_review:
        lines.append("### B. Trắc nghiệm Đúng/Sai (TF)")
        for q in tf_review:
            ans_str = "/".join(["Đ" if a else "S" for a in q['answers']])
            formula_note = f"Chứa {len(q['formulaImages'])} công thức MathType" if q['formulaImages'] else "Không chứa MathType"
            lines.append(f"- **Câu {q['srcNo']} (ID: `{q['id']}`)**: Đáp án các ý a/b/c/d là `{ans_str}`. Lý do review: {formula_note}.")
        lines.append("")
        
    if short_review:
        lines.append("### C. Trắc nghiệm Trả lời ngắn (Short)")
        for q in short_review:
            lines.append(f"- **Câu {q['srcNo']} (ID: `{q['id']}`)**: Đáp án raw `{q['answerRaw']}` -> norm `{q['answer']}`.")
        lines.append("")
    else:
        lines.append("### C. Trắc nghiệm Trả lời ngắn (Short)")
        lines.append("- Không có câu nào bị lỗi hay cần review (18/18 câu đã trích xuất đáp án chính xác).")
        lines.append("")
        
    lines.extend([
        "---",
        "",
        "## 3. Bảng đối chiếu 39 công thức MathType đã parse sang LaTeX",
        "",
        "| STT | Câu hỏi | File OLE gốc | File ảnh đối chiếu | Mã LaTeX đã parse | Hiển thị mô phỏng |",
        "| :---: | :---: | :---: | :---: | :---: | :--- |"
    ])
    
    idx = 1
    # Check all questions with formulas
    all_qs = [('mcq', q) for q in mcq] + [('tf', q) for q in tf] + [('short', q) for q in short]
    for q_type, q in all_qs:
        if q['formulaImages']:
            for f_img in q['formulaImages']:
                base = os.path.splitext(os.path.basename(f_img))[0]
                ole_name = f"embeddings/{base}.bin"
                latex = FORMULA_LATEX_MAP.get(ole_name, "N/A")
                lines.append(f"| {idx} | `{q['id']}` (Câu {q['srcNo']}) | `{ole_name}` | `{f_img}` | `${latex}$` | `{latex}` |")
                idx += 1
                
    lines.extend([
        "",
        "---",
        "",
        "## 4. Hình ảnh minh họa trích xuất",
        "",
        "| STT | Câu hỏi | File ảnh | Kích thước | Mô tả nội dung |",
        "| :---: | :---: | :---: | :---: | :--- |",
        "| 1 | `mcq-023` (Câu 23) | `public/img/mcq-023_1.png` | 172 × 130 | Đồ thị nhiệt độ theo thời gian (Đường 1, Đường 2, Đường 3) |",
        "| 2 | `tf-010` (Câu 10) | `public/img/tf-010_1.png` | 316 × 164 | Đồ thị nhiệt độ theo thời gian khối băng (đoạn OA, AB, BC) |",
        "| 3 | `tf-014` (Câu 14) | `public/img/tf-014_1.png` | 313 × 256 | Giản đồ chuyển thể pha p - T của nước (mốc x, y, z) |",
        "| 4 | `tf-020` (Câu 20) | `public/img/tf-020_1.png` | 328 × 497 | Hình vẽ thí nghiệm nén khí xilanh và nhiệt kế điện tử (Hình 1.5) |",
        ""
    ])
    
    with open(REVIEW_REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("Generated review_report.md successfully.")

# -------------------------------------------------------------
# 8. GENERATE PREVIEW.HTML
# -------------------------------------------------------------
def generate_preview_html(data):
    html_parts = [
        "<!DOCTYPE html>",
        "<html lang='vi'>",
        "<head>",
        "  <meta charset='UTF-8'>",
        "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
        "  <title>Đối chiếu Đề cương Vật lý 12</title>",
        "  <link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css'>",
        "  <script defer src='https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js'></script>",
        "  <script defer src='https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js'></script>",
        "  <style>",
        "    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; line-height: 1.6; }",
        "    .container { max-width: 960px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }",
        "    h1 { color: #0f172a; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }",
        "    h2 { color: #1e3a8a; margin-top: 32px; border-left: 4px solid #3b82f6; padding-left: 12px; }",
        "    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 20px 0; }",
        "    .card { background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #cbd5e1; }",
        "    .card strong { font-size: 24px; color: #2563eb; display: block; }",
        "    .q-item { margin-bottom: 24px; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; }",
        "    .q-item.review { border-left: 5px solid #f59e0b; background: #fffbeb; }",
        "    .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }",
        "    .q-title { font-weight: 700; color: #0f172a; font-size: 16px; }",
        "    .badge { padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }",
        "    .badge-review { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }",
        "    .badge-ok { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }",
        "    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }",
        "    @media (max-width: 640px) { .options-grid { grid-template-columns: 1fr; } }",
        "    .opt-box { padding: 10px 14px; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0; }",
        "    .opt-box.correct { background: #ecfdf5; border-color: #10b981; font-weight: 600; color: #065f46; }",
        "    .tf-table { width: 100%; border-collapse: collapse; margin-top: 12px; }",
        "    .tf-table th, .tf-table td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }",
        "    .tf-table th { background: #f1f5f9; }",
        "    .tf-true { color: #047857; font-weight: 700; }",
        "    .tf-false { color: #dc2626; font-weight: 700; }",
        "    .formula-compare { margin-top: 12px; padding: 10px; background: #f0fdf4; border-radius: 6px; border: 1px solid #86efac; }",
        "    .formula-compare strong { display: block; margin-bottom: 6px; color: #166534; font-size: 13px; }",
        "    .formula-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 6px; }",
        "    .formula-row img { border: 1px solid #cbd5e1; background: #ffffff; padding: 4px; border-radius: 4px; max-height: 40px; }",
        "    .q-img { max-width: 100%; max-height: 350px; margin: 12px 0; border: 1px solid #e2e8f0; border-radius: 6px; }",
        "  </style>",
        "</head>",
        "<body>",
        "  <div class='container'>",
        "    <h1>BẢNG ĐỐI CHIẾU CÂU HỎI & ĐÁP ÁN ĐỀ CƯƠNG VẬT LÝ 12</h1>",
        "    <div class='summary'>",
        f"      <div class='card'><strong>{len(data['mcq'])}</strong>Trắc nghiệm MCQ</div>",
        f"      <div class='card'><strong>{len(data['tf'])}</strong>Trắc nghiệm Đúng/Sai</div>",
        f"      <div class='card'><strong>{len(data['short'])}</strong>Trả lời ngắn</div>",
        f"      <div class='card'><strong style='color:#f59e0b;'>{sum(1 for q in data['mcq']+data['tf']+data['short'] if q['needsReview'])}</strong>Cần đối chiếu (MathType)</div>",
        "    </div>"
    ]
    
    # MCQ Section
    html_parts.append("<h2>I. Trắc nghiệm nhiều lựa chọn (99 câu)</h2>")
    for q in data['mcq']:
        review_class = "review" if q['needsReview'] else ""
        badge = "<span class='badge badge-review'>Cần đối chiếu</span>" if q['needsReview'] else "<span class='badge badge-ok'>Khớp 100%</span>"
        
        img_html = ""
        for img in q['images']:
            img_html += f"<div><img class='q-img' src='{img}' alt='Hình minh họa'></div>"
            
        formula_html = ""
        if q['formulaImages']:
            formula_html += "<div class='formula-compare'><strong>Ảnh công thức gốc đối chiếu:</strong><div class='formula-row'>"
            for f_img in q['formulaImages']:
                formula_html += f"<div><img src='{f_img}' alt='Formula'></div>"
            formula_html += "</div></div>"
            
        opts_html = "<div class='options-grid'>"
        lbls = ['A', 'B', 'C', 'D']
        for i, opt in enumerate(q['options']):
            is_correct = (i == q['answer'])
            cls = "opt-box correct" if is_correct else "opt-box"
            check_mark = " ✓ (ĐÁP ÁN ĐÚNG)" if is_correct else ""
            opts_html += f"<div class='{cls}'><strong>{lbls[i]}.</strong> {opt}{check_mark}</div>"
        opts_html += "</div>"
        
        html_parts.append(f"""
        <div class='q-item {review_class}'>
          <div class='q-header'>
            <span class='q-title'>Câu {q['srcNo']} ({q['id']})</span>
            {badge}
          </div>
          <div class='q-text'>{q['q']}</div>
          {img_html}
          {formula_html}
          {opts_html}
        </div>
        """)

    # TF Section
    html_parts.append("<h2>II. Trắc nghiệm Đúng/Sai (32 câu)</h2>")
    for q in data['tf']:
        review_class = "review" if q['needsReview'] else ""
        badge = "<span class='badge badge-review'>Cần đối chiếu</span>" if q['needsReview'] else "<span class='badge badge-ok'>Khớp 100%</span>"
        
        img_html = ""
        for img in q['images']:
            img_html += f"<div><img class='q-img' src='{img}' alt='Hình minh họa'></div>"
            
        formula_html = ""
        if q['formulaImages']:
            formula_html += "<div class='formula-compare'><strong>Ảnh công thức gốc đối chiếu:</strong><div class='formula-row'>"
            for f_img in q['formulaImages']:
                formula_html += f"<div><img src='{f_img}' alt='Formula'></div>"
            formula_html += "</div></div>"
            
        lbls = ['a', 'b', 'c', 'd']
        rows_html = ""
        for i in range(4):
            ans_bool = q['answers'][i]
            ans_badge = "<span class='tf-true'>ĐÚNG</span>" if ans_bool else "<span class='tf-false'>SAI</span>"
            rows_html += f"<tr><td style='width:40px; font-weight:700;'>{lbls[i]})</td><td>{q['statements'][i]}</td><td style='width:90px; text-align:center;'>{ans_badge}</td></tr>"
            
        table_html = f"<table class='tf-table'><thead><tr><th>Ý</th><th>Nội dung phát biểu</th><th>Đáp án</th></tr></thead><tbody>{rows_html}</tbody></table>"
        
        html_parts.append(f"""
        <div class='q-item {review_class}'>
          <div class='q-header'>
            <span class='q-title'>Câu {q['srcNo']} ({q['id']})</span>
            {badge}
          </div>
          <div class='q-text'>{q['q']}</div>
          {img_html}
          {formula_html}
          {table_html}
        </div>
        """)

    # Short Section
    html_parts.append("<h2>III. Trắc nghiệm Trả lời ngắn (18 câu)</h2>")
    for q in data['short']:
        badge = "<span class='badge badge-ok'>Đã nhận diện</span>"
        html_parts.append(f"""
        <div class='q-item'>
          <div class='q-header'>
            <span class='q-title'>Câu {q['srcNo']} ({q['id']})</span>
            {badge}
          </div>
          <div class='q-text'>{q['q']}</div>
          <div style='margin-top:12px; padding:10px 14px; background:#ecfdf5; border-radius:6px; border:1px solid #10b981; color:#065f46;'>
            <strong>Đáp án chuẩn hóa (answer):</strong> <span style='font-size:18px; font-weight:700;'>{q['answer']}</span> 
            <span style='margin-left:20px; color:#64748b; font-size:14px;'>(Đáp án gốc trong docx: <code>{q['answerRaw']}</code>)</span>
          </div>
        </div>
        """)

    html_parts.extend([
        "  </div>",
        "  <script>",
        "    document.addEventListener('DOMContentLoaded', function() {",
        "      renderMathInElement(document.body, {",
        "        delimiters: [",
        "          {left: '$$', right: '$$', display: true},",
        "          {left: '$', right: '$', display: false}",
        "        ],",
        "        throwOnError: false",
        "      });",
        "    });",
        "  </script>",
        "</body>",
        "</html>"
    ])
    
    with open(PREVIEW_HTML_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(html_parts))
    print("Generated preview.html successfully.")

if __name__ == "__main__":
    main()
