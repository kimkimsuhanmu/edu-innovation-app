#!/usr/bin/env python3
"""
김포도시관리공사 e-캠퍼스 앱 아이콘 생성 스크립트
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_company_logo():
    """김포도시관리공사 로고 생성"""
    
    # 아이콘 크기들
    sizes = {
        'icon.png': 1024,
        'adaptive-icon.png': 1024,
        'splash.png': 2048,
        'favicon.png': 512
    }
    
    for filename, size in sizes.items():
        # 이미지 생성
        img = Image.new('RGBA', (size, size), (52, 152, 219, 255))  # 파란색 배경
        draw = ImageDraw.Draw(img)
        
        # 중앙에 원 그리기
        margin = size // 8
        draw.ellipse([margin, margin, size-margin, size-margin], 
                    fill=(255, 255, 255, 255), outline=(41, 128, 185, 255), width=size//64)
        
        # 텍스트 추가 (아이콘 크기에 따라 폰트 크기 조정)
        font_size = size // 8
        try:
            # 시스템 폰트 사용
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            # 기본 폰트 사용
            font = ImageFont.load_default()
        
        # 텍스트 그리기
        text = "김포"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (size - text_width) // 2
        y = (size - text_height) // 2
        
        draw.text((x, y), text, fill=(52, 152, 219, 255), font=font)
        
        # 파일 저장
        img.save(f'assets/{filename}')
        print(f"Created {filename} ({size}x{size})")

if __name__ == "__main__":
    # assets 폴더 생성
    os.makedirs('assets', exist_ok=True)
    
    # 로고 생성
    create_company_logo()
    print("김포도시관리공사 로고 생성 완료!")
