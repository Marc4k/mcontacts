import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Colors and text styles for the editorial, dark-mode contacts UI.
class AppColors {
  AppColors._();

  static const background = Color(0xFF0B0B0D);

  static const textPrimary = Color(0xFFF4F4F5);
  static const textHeading = Color(0xFFF6F4F2);

  static final textSecondary = Colors.white.withValues(alpha: 0.55);
  static final textMuted = Colors.white.withValues(alpha: 0.4);
  static final textFaint = Colors.white.withValues(alpha: 0.35);

  static const accent = Color(0xFFFB923C);
  static const accentOnAccent = Color(0xFF2A1405);

  static final surface = Colors.white.withValues(alpha: 0.05);
  static final surfaceStrong = Colors.white.withValues(alpha: 0.07);
  static final surfaceBorder = Colors.white.withValues(alpha: 0.07);
  static final divider = Colors.white.withValues(alpha: 0.06);
  static final avatarNeutralBg = Colors.white.withValues(alpha: 0.07);
  static final avatarNeutralText = Colors.white.withValues(alpha: 0.7);
}

/// Fonts: Space Grotesk for UI text, Instrument Serif italic for editorial
/// headings and field labels.
class AppText {
  AppText._();

  static TextStyle sans({
    double size = 15,
    FontWeight weight = FontWeight.w400,
    Color? color,
    double? letterSpacing,
  }) => GoogleFonts.spaceGrotesk(
    fontSize: size,
    fontWeight: weight,
    color: color ?? AppColors.textPrimary,
    letterSpacing: letterSpacing,
  );

  static TextStyle serifHeading({double size = 44, Color? color}) =>
      GoogleFonts.instrumentSerif(
        fontSize: size,
        fontWeight: FontWeight.w400,
        height: 0.95,
        color: color ?? AppColors.textHeading,
        letterSpacing: -0.3,
      );

  static TextStyle serifLabel({double size = 18, Color? color}) =>
      GoogleFonts.instrumentSerif(
        fontSize: size,
        fontStyle: FontStyle.italic,
        color: color ?? AppColors.textMuted,
      );
}

ThemeData buildAppTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: AppColors.background,
    primaryColor: AppColors.accent,
    colorScheme: base.colorScheme.copyWith(
      primary: AppColors.accent,
      surface: AppColors.background,
    ),
    textTheme: GoogleFonts.spaceGroteskTextTheme(base.textTheme).apply(
      bodyColor: AppColors.textPrimary,
      displayColor: AppColors.textPrimary,
    ),
    splashFactory: NoSplash.splashFactory,
    highlightColor: Colors.transparent,
  );
}
