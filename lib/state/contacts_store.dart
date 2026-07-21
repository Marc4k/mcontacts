import 'package:flutter/widgets.dart';

import '../data/device_contacts.dart';
import '../data/mock_contacts.dart';
import '../models/contact.dart';

/// Holds the in-memory contacts list and notifies listeners on change.
class ContactsStore extends ChangeNotifier {
  ContactsStore() : _contacts = buildMockContacts();

  final List<Contact> _contacts;

  bool _isImporting = false;
  bool get isImporting => _isImporting;

  /// Human-readable result of the most recent [loadFromDevice] call.
  String? statusMessage;

  List<Contact> get contacts => List.unmodifiable(_contacts);

  List<Contact> search(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return const [];
    return _contacts
        .where((c) =>
            c.fullName.toLowerCase().contains(q) ||
            c.subtitle.toLowerCase().contains(q) ||
            c.phone.toLowerCase().contains(q) ||
            c.email.toLowerCase().contains(q))
        .toList();
  }

  void updateContact(Contact updated) {
    final index = _contacts.indexWhere((c) => c.id == updated.id);
    if (index == -1) return;
    _contacts[index] = updated;
    notifyListeners();
  }

  void addContact(Contact contact) {
    _contacts.add(contact);
    notifyListeners();
  }

  /// Requests permission and replaces the list with the device's contacts.
  /// Sets [statusMessage] to describe the outcome; safe to call repeatedly.
  Future<void> loadFromDevice() async {
    if (_isImporting) return;
    _isImporting = true;
    statusMessage = null;
    notifyListeners();

    try {
      final result = await fetchDeviceContacts();
      if (!result.granted) {
        statusMessage = 'Contacts permission denied';
      } else {
        _contacts
          ..clear()
          ..addAll(result.contacts);
        statusMessage = 'Imported ${result.contacts.length} '
            'contact${result.contacts.length == 1 ? '' : 's'}';
      }
    } catch (e) {
      statusMessage = 'Could not read contacts: $e';
    } finally {
      _isImporting = false;
      notifyListeners();
    }
  }
}

/// Makes a [ContactsStore] available to descendants without adding a
/// state-management package as a dependency.
class ContactsScope extends InheritedNotifier<ContactsStore> {
  const ContactsScope({
    super.key,
    required ContactsStore store,
    required super.child,
  }) : super(notifier: store);

  static ContactsStore of(BuildContext context) {
    final scope =
        context.dependOnInheritedWidgetOfExactType<ContactsScope>();
    assert(scope != null, 'No ContactsScope found in context');
    return scope!.notifier!;
  }
}
