from PIL import Image
import os

# assets 디렉토리 생성
os.makedirs('assets', exist_ok=True)

# 1024x1024 아이콘 생성
icon = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
icon.save('assets/icon.png')

# 1024x1024 스플래시 이미지 생성
splash = Image.new('RGBA', (1024, 1024), (255, 255, 255, 255))
splash.save('assets/splash.png')

# 1024x1024 적응형 아이콘 생성
adaptive_icon = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
adaptive_icon.save('assets/adaptive-icon.png')

# 32x32 파비콘 생성
favicon = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
favicon.save('assets/favicon.png')

print("Assets files created successfully!")
