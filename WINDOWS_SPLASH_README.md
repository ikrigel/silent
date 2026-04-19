# Generate Splash Screens on Windows

## Quick Setup

### 1. Install Python (if not already installed)

Download from [python.org](https://www.python.org/downloads/) and install.

Check it's installed:
```cmd
python --version
```

### 2. Install Pillow (image library)

Open **Command Prompt** and run:
```cmd
python -m pip install pillow
```

Or:
```cmd
pip install pillow
```

### 3. Run the script

From the project root directory, run:
```cmd
python generate_splash_pngs.py
```

That's it! The script will generate all splash PNGs and save them to the correct Android directories.

## What the script does

✅ Creates ZZZ letters + phone handset icon on teal background
✅ Generates all DPI variants (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
✅ Saves to `drawable/`, `drawable-land-*`, `drawable-port-*` directories
✅ Optimizes PNGs automatically

## After running the script

```cmd
# View generated files
dir android\app\src\main\res\drawable*\splash.png

# Commit changes
git add android/app/src/main/res/drawable*/splash.png
git commit -m "chore: regenerate splash screens with ZZZ + phone design"

# Push to trigger APK build
git push origin master
```

## Troubleshooting

**"ModuleNotFoundError: No module named 'PIL'"**
→ Install Pillow: `python -m pip install pillow`

**"python: command not found"**
→ Python not in PATH. Add Python to PATH or use full path to python.exe

**Images look small/simple**
→ This is normal if arial.ttf isn't found. The script uses OS default fonts as fallback. To use bold fonts, ensure arial.ttf is in `C:\Windows\Fonts\`

## Customizing the design

Edit `generate_splash_pngs.py` to change:
- `TEAL = (38, 166, 154)` — Background color (RGB)
- `font_large = ImageFont.truetype("arial.ttf", 280)` — Font size (280, 200, 140 for Z letters)
- Phone dimensions (phone_w, phone_h, etc.)

Then run `python generate_splash_pngs.py` again.
