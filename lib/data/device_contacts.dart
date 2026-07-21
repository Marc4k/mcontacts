import 'package:flutter_contacts/flutter_contacts.dart' as fc;

import '../models/contact.dart';

/// Outcome of a device-contacts import.
class DeviceContactsResult {
  const DeviceContactsResult({required this.granted, required this.contacts});

  /// Whether the user granted contacts permission.
  final bool granted;

  /// Contacts read from the device, mapped to the app's [Contact] model.
  /// Empty when [granted] is false.
  final List<Contact> contacts;
}

/// Requests contacts permission and reads every contact from the device
/// address book, mapping each into the app's [Contact] model.
///
/// Backed by the `flutter_contacts` package, which supports Android, iOS and
/// macOS. Returns a result with `granted == false` when permission is denied;
/// throws if the platform read itself fails.
Future<DeviceContactsResult> fetchDeviceContacts() async {
  final status =
      await fc.FlutterContacts.permissions.request(fc.PermissionType.read);
  if (status != fc.PermissionStatus.granted) {
    return const DeviceContactsResult(granted: false, contacts: []);
  }

  final deviceContacts = await fc.FlutterContacts.getAll(
    properties: {
      fc.ContactProperty.name,
      fc.ContactProperty.phone,
      fc.ContactProperty.email,
    },
  );

  final contacts = deviceContacts.map(_toAppContact).toList();
  return DeviceContactsResult(granted: true, contacts: contacts);
}

/// Maps a device [fc.Contact] onto the app's [Contact], falling back to the
/// display name when the structured name parts are empty.
Contact _toAppContact(fc.Contact source) {
  var first = (source.name?.first ?? '').trim();
  var last = (source.name?.last ?? '').trim();

  if (first.isEmpty && last.isEmpty) {
    final display = (source.displayName ?? '').trim();
    final parts = display.isEmpty ? const <String>[] : display.split(RegExp(r'\s+'));
    first = parts.isNotEmpty ? parts.first : '';
    last = parts.length > 1 ? parts.sublist(1).join(' ') : '';
  }

  return Contact(
    id: source.id ?? '',
    firstName: first,
    lastName: last,
    phone: source.phones.isNotEmpty ? source.phones.first.number : '',
    email: source.emails.isNotEmpty ? source.emails.first.address : '',
  );
}
