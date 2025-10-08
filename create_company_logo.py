from PIL import Image, ImageDraw, ImageFont
import os

# assets 디렉토리 생성
os.makedirs('assets', exist_ok=True)

def create_icon(size, filename, text="김포"):
    # 아이콘 생성
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # 배경 원 그리기
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], 
                fill=(52, 152, 219, 255), outline=(41, 128, 185, 255), width=3)
    
    # 텍스트 그리기
    try:
        # 폰트 크기 계산
        font_size = size // 3
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # 기본 폰트 사용
        font = ImageFont.load_default()
    
    # 텍스트 중앙 정렬
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    img.save(filename)
    print(f"Created {filename} ({size}x{size})")

# 아이콘들 생성
create_icon(1024, 'assets/icon.png', "김포")
create_icon(1024, 'assets/adaptive-icon.png', "김포")
create_icon(1024, 'assets/splash.png', "김포도시관리공사\nE-캠퍼스")
create_icon(32, 'assets/favicon.png', "김")

print("Company logo assets created successfully!")
