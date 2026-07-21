import 'package:flutter/material.dart';

import '../state/contacts_store.dart';
import '../theme/app_theme.dart';
import '../widgets/contact_avatar.dart';
import 'edit_contact_screen.dart';

class ContactDetailScreen extends StatelessWidget {
  const ContactDetailScreen({super.key, required this.contactId});

  final String contactId;

  @override
  Widget build(BuildContext context) {
    final store = ContactsScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final contact = store.contacts.firstWhere((c) => c.id == contactId);
        return Scaffold(
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(26, 8, 26, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _RoundIconButton(
                        icon: Icons.arrow_back_ios_new,
                        onTap: () => Navigator.of(context).pop(),
                      ),
                      _RoundIconButton(
                        icon: Icons.edit_outlined,
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => EditContactScreen(contactId: contact.id),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 22),
                  ContactAvatar(contact: contact, size: 88),
                  const SizedBox(height: 20),
                  Text(
                    contact.firstName,
                    style: AppText.serifHeading(size: 48),
                  ),
                  Text(
                    contact.lastName,
                    style: AppText.serifHeading(size: 48),
                  ),
                  if (contact.subtitle.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text(
                      contact.subtitle,
                      style: AppText.sans(size: 14, color: AppColors.accent),
                    ),
                  ],
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: _ActionButton(
                          label: 'Call',
                          icon: Icons.call,
                          filled: true,
                          onTap: () => _showActionSnack(context, 'Calling ${contact.firstName}…'),
                        ),
                      ),
                      const SizedBox(width: 11),
                      Expanded(
                        child: _ActionButton(
                          label: 'Message',
                          icon: null,
                          filled: false,
                          onTap: () => _showActionSnack(
                              context, 'Messaging ${contact.firstName}…'),
                        ),
                      ),
                      const SizedBox(width: 11),
                      _RoundIconButton(
                        icon: Icons.email_outlined,
                        onTap: () => _showActionSnack(
                            context, 'Emailing ${contact.firstName}…'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 26),
                  if (contact.phone.isNotEmpty)
                    _InfoField(label: 'mobile', value: contact.phone),
                  if (contact.email.isNotEmpty)
                    _InfoField(label: 'email', value: contact.email),
                  if (contact.notes.isNotEmpty)
                    _InfoField(label: 'notes', value: contact.notes, isLast: true),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showActionSnack(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 40,
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.surfaceStrong,
        ),
        child: Icon(icon, size: 17, color: AppColors.textPrimary),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.icon,
    required this.filled,
    required this.onTap,
  });

  final String label;
  final IconData? icon;
  final bool filled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: filled ? AppColors.accent : AppColors.surfaceStrong,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 15, color: AppColors.accentOnAccent),
              const SizedBox(width: 7),
            ],
            Text(
              label,
              style: AppText.sans(
                size: 14,
                weight: FontWeight.w600,
                color: filled ? AppColors.accentOnAccent : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoField extends StatelessWidget {
  const _InfoField({required this.label, required this.value, this.isLast = false});

  final String label;
  final String value;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppText.serifLabel(size: 19)),
        const SizedBox(height: 6),
        Text(value, style: AppText.sans(size: 17)),
        if (!isLast) ...[
          const SizedBox(height: 16),
          Container(height: 1, color: AppColors.divider),
          const SizedBox(height: 16),
        ],
      ],
    );
  }
}
