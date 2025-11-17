import copy
import xml.etree.ElementTree as ET
import sys

# --- 설정: 이 부분을 사용자의 환경에 맞게 수정하세요 ---

INPUT_SVG_PATH = "original.svg"
OUTPUT_SVG_PATH = "animated_result.svg"

# ----------------------------------------------------

# 네임스페이스 보존
ET.register_namespace("", "http://www.w3.org/2000/svg")

# 원본 SVG 파일 읽기
try:
    tree = ET.parse(INPUT_SVG_PATH)
    root = tree.getroot()
except FileNotFoundError:
    print(f"오류: 원본 파일 '{INPUT_SVG_PATH}'을(를) 찾을 수 없습니다.")
    sys.exit(1)
except ET.ParseError:
    print(f"오류: '{INPUT_SVG_PATH}' 파일이 올바른 SVG/XML 형식이 아닙니다.")
    sys.exit(1)

# 원본 복제
animated_root = copy.deepcopy(root)

# 헬퍼 함수 1: 특정 id를 가진 요소 찾기
def find_by_id(root_elem, elem_id):
    """
    루트 요소에서 시작하여 특정 ID를 가진 요소를 찾습니다.
    """
    for elem in root_elem.iter():
        if elem.attrib.get("id") == elem_id:
            return elem
    return None

# 헬퍼 함수 2: 요소 '자체'에 애니메이션 추가
def add_animation(elem, animation_str):
    """
    주어진 요소(elem)에 XML 문자열로 된 애니메이션 태그를 자식으로 추가합니다.
    """
    if elem is not None:
        try:
            anim_elem = ET.fromstring(animation_str)
            elem.append(anim_elem)
        except ET.ParseError as e:
            print(f"경고: 애니메이션 XML 파싱 오류. {e} (문자열: {animation_str})")
    else:
        # ID를 못 찾은 경우
        # (이 경고는 아래에서 ID별로 따로 처리)
        pass

# 헬퍼 함수 3
def add_animation_to_children(parent_elem, animation_str):
    """
    주어진 부모 요소(parent_elem)의 '모든 자식 요소'에 애니메이션을 추가합니다.
    """
    if parent_elem is not None:
        try:
            anim_template = ET.fromstring(animation_str)
            for child_elem in parent_elem:
                anim_copy = copy.deepcopy(anim_template)
                child_elem.append(anim_copy)
        except ET.ParseError as e:
            print(f"경고: 애니메이션 XML 파싱 오류. {e}")
    else:
        print(f"경고: 애니메이션을 추가할 '부모' 요소를 찾지 못했습니다. (ID 확인 필요)")

# --- 애니메이션 적용 시작 ---

print(f"'{INPUT_SVG_PATH}' 파일을 읽었습니다. 애니메이션 추가를 시작합니다...")


# --- (1) 눈(LED) 애니메이션 (색상 '번쩍임') ---

LED_ORIGINAL_COLOR = "#f4ac24" # LED의 원래 노란색 (가정)
LED_FLASH_COLOR = "#ffffff" # 흰색으로 번쩍임

led_anim = f"""
<animate attributeName="fill"
         values="{LED_ORIGINAL_COLOR}; {LED_FLASH_COLOR}; {LED_ORIGINAL_COLOR}; {LED_ORIGINAL_COLOR}"
         keyTimes="0; 0.05; 0.1; 1"
         dur="2s" repeatCount="indefinite" xmlns="http://www.w3.org/2000/svg" />
"""

print("로봇 눈(LED)에 애니메이션 적용 중...")
right_led = find_by_id(animated_root, "rightLED")
left_led = find_by_id(animated_root, "leftLED")

add_animation(right_led, led_anim)
add_animation(left_led, led_anim)

if right_led is None or left_led is None:
    print("경고: 'rightLED' 또는 'leftLED' ID를 가진 요소를 찾지 못했습니다.")


# --- (1.5) 머리(LED) 애니메이션 수정 (서서히 변화) ---

LED_HEAD_ORIGINAL_COLOR = "#c74418" # c74418ff 에서 ff 제외
LED_HEAD_SIGNAL_COLOR = "#f4ac24"   # 눈 LED와 동일한 노란색 (신호 색)

# 3초 주기로 '원래색 -> 신호색 -> 원래색'으로 서서히 변하도록 수정
# keyTimes를 제거하여 부드러운 transition(변화)을 만듭니다.
head_led_anim = f"""
<animate attributeName="fill"
         values="{LED_HEAD_ORIGINAL_COLOR};{LED_HEAD_SIGNAL_COLOR};{LED_HEAD_ORIGINAL_COLOR}"
         dur="3s" 
         repeatCount="indefinite" xmlns="http://www.w3.org/2000/svg" />
"""

print("로봇 머리(LED)에 애니메이션 적용 중...")
head_led = find_by_id(animated_root, "headLED")
add_animation(head_led, head_led_anim)

if head_led is None:
    print("경고: 'headLED' ID를 가진 요소를 찾지 못했습니다.")


# --- (2) 입 애니메이션 (개별 ID 타겟팅) ---

# 색상 정의 (ff 알파값 제외)
COLOR_1 = "#c64217" # mouse1, mouse4의 원래 색
COLOR_2 = "#f4ac24" # mouse2, mouse3의 원래 색
DURATION = "2s"     # 2초 주기

# 애니메이션 정의 1 (Color 1 -> Color 2 -> Hold -> Color 1 -> Hold)
anim_mouth_1 = f"""
<animate attributeName="fill"
         values="{COLOR_1};{COLOR_2};{COLOR_2};{COLOR_1};{COLOR_1}"
         keyTimes="0; 0.25; 0.5; 0.75; 1"
         dur="{DURATION}" repeatCount="indefinite" xmlns="http://www.w3.org/2000/svg" />
"""

# 애니메이션 정의 2 (Color 2 -> Color 1 -> Hold -> Color 2 -> Hold)
anim_mouth_2 = f"""
<animate attributeName="fill"
         values="{COLOR_2};{COLOR_1};{COLOR_1};{COLOR_2};{COLOR_2}"
         keyTimes="0; 0.25; 0.5; 0.75; 1"
         dur="{DURATION}" repeatCount="indefinite" xmlns="http://www.w3.org/2000/svg" />
"""

print("로봇 입에 개별 애니메이션 적용 중...")

# 각 ID를 가진 요소를 찾습니다.
mouth_part_1 = find_by_id(animated_root, "mouse1")
mouth_part_2 = find_by_id(animated_root, "mouse2")
mouth_part_3 = find_by_id(animated_root, "mouse3")
mouth_part_4 = find_by_id(animated_root, "mouse4")

# 애니메이션 적용
add_animation(mouth_part_1, anim_mouth_1)
add_animation(mouth_part_4, anim_mouth_1)
add_animation(mouth_part_2, anim_mouth_2)
add_animation(mouth_part_3, anim_mouth_2)

# ID를 찾았는지 확인
if any(p is None for p in [mouth_part_1, mouth_part_2, mouth_part_3, mouth_part_4]):
    print("경고: 'mouse1', 'mouse2', 'mouse3', 'mouse4' ID 중 일부를 찾지 못했습니다.")
    print("SVG 편집기에서 입을 구성하는 4개 도형의 ID가 올바르게 설정되었는지 확인하세요.")


# --- (3) 텍스트 리듬 애니메이션 (기존과 동일) ---
text_anim = """
<animateTransform attributeName="transform" attributeType="XML" type="translate"
                 values="0,0; 0,-5; 0,0; 0,5; 0,0" dur="1.5s" repeatCount="indefinite" xmlns="http://www.w3.org/2000/svg" />
"""

print("텍스트에 애니메이션 적용 중...")
text_elem = find_by_id(animated_root, "LyricsSync")
add_animation(text_elem, text_anim) # 그룹 자체에 적용

if text_elem is None:
    print("경고: 'LyricsSync' ID를 가진 요소를 찾지 못했습니다.")


# --- 새로운 파일 저장 ---
try:
    ET.ElementTree(animated_root).write(OUTPUT_SVG_PATH, encoding="utf-8", xml_declaration=True)
    print(f"\n성공! 애니메이션이 추가된 파일이 '{OUTPUT_SVG_PATH}'(으)로 저장되었습니다.")
except IOError as e:
    print(f"\n오류: 파일을 저장하는 데 실패했습니다. {e}")
    print(f"'{OUTPUT_SVG_PATH}' 경로에 쓰기 권한이 있는지 확인하세요.")