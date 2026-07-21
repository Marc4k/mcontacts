import 'package:flutter/material.dart';

import '../models/contact.dart';
import '../theme/app_theme.dart';

/// Circular initials avatar ("mono-n" in the source design).
class ContactAvatar extends StatelessWidget {
  const ContactAvatar({super.key, required this.contact, this.size = 44});

  final Contact contact;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.avatarNeutralBg,
      ),
      child: Text(
        contact.initials,
        style: AppText.sans(
          size: size * 0.36,
          weight: FontWeight.w600,
          color: AppColors.avatarNeutralText,
        ),
      ),
    );
  }
}
