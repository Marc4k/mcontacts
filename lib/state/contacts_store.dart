import 'package:flutter/widgets.dart';

import '../data/mock_contacts.dart';
import '../models/contact.dart';

/// Holds the in-memory contacts list and notifies listeners on change.
class ContactsStore extends ChangeNotifier {
  ContactsStore() : _contacts = buildMockContacts();

  final List<Contact> _contacts;

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
