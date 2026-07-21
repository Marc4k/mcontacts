import 'package:flutter/material.dart';

import '../models/contact.dart';
import '../theme/app_theme.dart';
import 'contact_avatar.dart';

/// A single tappable contact row, matching the design's `.rowitem`.
class ContactRow extends StatelessWidget {
  const ContactRow({
    super.key,
    required this.contact,
    required this.onTap,
    this.highlightQuery = '',
  });

  final Contact contact;
  final VoidCallback onTap;

  /// When non-empty, the matching portion of the first name is drawn in
  /// the accent color, as in the search results screen.
  final String highlightQuery;

  @override
  Widget build(BuildContext context) {
    final subtitle = contact.subtitle.isNotEmpty
        ? contact.subtitle
        : contact.phone;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 11),
        child: Row(
          children: [
            ContactAvatar(contact: contact),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildName(),
                  if (subtitle.isNotEmpty)
                    Text(
                      subtitle,
                      style: AppText.sans(size: 13, color: AppColors.textMuted),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildName() {
    final nameStyle = AppText.sans(size: 17, weight: FontWeight.w500);
    final query = highlightQuery.trim().toLowerCase();
    if (query.isEmpty || !contact.firstName.toLowerCase().startsWith(query)) {
      return Text(contact.fullName, style: nameStyle);
    }
    final matchLen = query.length;
    return RichText(
      text: TextSpan(
        style: nameStyle,
        children: [
          TextSpan(
            text: contact.firstName.substring(0, matchLen),
            style: nameStyle.copyWith(color: AppColors.accent),
          ),
          TextSpan(text: contact.firstName.substring(matchLen)),
          TextSpan(text: ' ${contact.lastName}'),
        ],
      ),
    );
  }
}

/// Thin hairline divider between rows, matching `.divider`.
class ContactRowDivider extends StatelessWidget {
  const ContactRowDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(height: 1, color: AppColors.divider);
  }
}
