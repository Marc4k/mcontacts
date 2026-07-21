import 'package:flutter/material.dart';

import '../models/contact.dart';
import '../state/contacts_store.dart';
import '../theme/app_theme.dart';

/// Add or edit a contact. Pass [contactId] to edit an existing contact,
/// or omit it to create a new one.
class EditContactScreen extends StatefulWidget {
  const EditContactScreen({super.key, this.contactId});

  final String? contactId;

  @override
  State<EditContactScreen> createState() => _EditContactScreenState();
}

class _EditContactScreenState extends State<EditContactScreen> {
  late final TextEditingController _firstName;
  late final TextEditingController _lastName;
  late final TextEditingController _phone;
  late final TextEditingController _email;

  @override
  void initState() {
    super.initState();
    Contact? existing;
    if (widget.contactId != null) {
      final store = ContactsScope.of(context);
      existing = store.contacts.firstWhere((c) => c.id == widget.contactId);
    }
    _firstName = TextEditingController(text: existing?.firstName ?? '');
    _lastName = TextEditingController(text: existing?.lastName ?? '');
    _phone = TextEditingController(text: existing?.phone ?? '');
    _email = TextEditingController(text: existing?.email ?? '');
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _phone.dispose();
    _email.dispose();
    super.dispose();
  }

  bool get _isNew => widget.contactId == null;

  void _save() {
    if (_firstName.text.trim().isEmpty) return;
    final store = ContactsScope.of(context);
    if (_isNew) {
      store.addContact(Contact(
        id: '${_firstName.text.trim()}-${_lastName.text.trim()}-${DateTime.now().microsecondsSinceEpoch}',
        firstName: _firstName.text.trim(),
        lastName: _lastName.text.trim(),
        phone: _phone.text.trim(),
        email: _email.text.trim(),
      ));
    } else {
      final existing = store.contacts.firstWhere((c) => c.id == widget.contactId);
      store.updateContact(Contact(
        id: existing.id,
        firstName: _firstName.text.trim(),
        lastName: _lastName.text.trim(),
        subtitle: existing.subtitle,
        phone: _phone.text.trim(),
        email: _email.text.trim(),
        notes: existing.notes,
      ));
    }
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(26, 8, 26, 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Text('Cancel',
                        style: AppText.sans(size: 15, color: AppColors.textSecondary)),
                  ),
                  GestureDetector(
                    onTap: _save,
                    child: Text('Save',
                        style: AppText.sans(
                            size: 15, weight: FontWeight.w600, color: AppColors.accent)),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(_isNew ? 'New contact' : 'Edit contact',
                  style: AppText.serifHeading(size: 40)),
              const SizedBox(height: 22),
              Center(
                child: Container(
                  width: 92,
                  height: 92,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.surface,
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.2),
                      width: 1.5,
                      style: BorderStyle.solid,
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.add, size: 22, color: AppColors.textMuted),
                      const SizedBox(height: 3),
                      Text('Photo',
                          style: AppText.sans(size: 9, color: AppColors.textMuted)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),
              _FormField(label: 'first name', controller: _firstName, autofocus: _isNew),
              _FormField(label: 'last name', controller: _lastName),
              _FormField(label: 'phone', controller: _phone, keyboardType: TextInputType.phone),
              _FormField(label: 'email', controller: _email, keyboardType: TextInputType.emailAddress),
            ],
          ),
        ),
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  const _FormField({
    required this.label,
    required this.controller,
    this.keyboardType,
    this.autofocus = false,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppText.serifLabel(size: 18)),
          const SizedBox(height: 5),
          TextField(
            controller: controller,
            autofocus: autofocus,
            keyboardType: keyboardType,
            style: AppText.sans(size: 20, weight: FontWeight.w500),
            cursorColor: AppColors.accent,
            decoration: InputDecoration(
              isDense: true,
              contentPadding: const EdgeInsets.only(bottom: 10),
              border: UnderlineInputBorder(
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
              ),
              enabledBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
              ),
              focusedBorder: const UnderlineInputBorder(
                borderSide: BorderSide(color: AppColors.accent, width: 1.5),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
