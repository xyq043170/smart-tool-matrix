"""Prompt templates for image generation."""


ZODIAC_SIGNS = [
    "Capricorn", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini",
    "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius",
]


def _get_zodiac(birthday: str) -> str:
    """Get zodiac sign from birthday string (YYYY-MM-DD)."""
    try:
        parts = birthday.split("-")
        month = int(parts[1])
        day = int(parts[2])
    except (IndexError, ValueError):
        return "Aries"

    dates = [
        (1, 20), (2, 19), (3, 20), (4, 20), (5, 21), (6, 21),
        (7, 22), (8, 23), (9, 23), (10, 23), (11, 22), (12, 22),
    ]

    for i, (m, d) in enumerate(dates):
        if month == m and day <= d:
            return ZODIAC_SIGNS[i]
        if month == m and day > d:
            return ZODIAC_SIGNS[(i + 1) % 12]

    return ZODIAC_SIGNS[0]


PORTRAIT_STYLES = {
    "mystical": "mystical ethereal fantasy portrait, glowing aura, cosmic energy, deep purple and gold palette",
    "eastern": "traditional Chinese painting style portrait, ink wash technique, elegant flowing robes, lotus and cloud motifs",
    "cosmic": "cosmic space portrait, nebula background, stardust particles, bioluminescent accents, deep space colors",
    "abstract": "abstract artistic portrait, geometric patterns, vibrant color blocks, modern art aesthetic, bold composition",
}


def build_portrait_prompt(gender: str, birthday: str, style: str = "mystical") -> str:
    """Build portrait generation prompt."""
    zodiac = _get_zodiac(birthday)
    style_desc = PORTRAIT_STYLES.get(style, PORTRAIT_STYLES["mystical"])

    gender_term = "female" if gender.lower() in ("female", "f", "woman", "女") else "male"

    prompt = (
        f"A {style_desc} of a {gender_term} figure, "
        f"born under the sign of {zodiac}, "
        f"with elemental energy flowing around them, "
        f"ethereal lighting, rich symbolism, high detail, "
        f"beautiful composition, no text in image. "
        f"Professional quality digital art."
    )

    return prompt
