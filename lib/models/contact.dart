/// A single contact card.
class Contact {
  Contact({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.subtitle = '',
    this.phone = '',
    this.email = '',
    this.notes = '',
  });

  final String id;
  String firstName;
  String lastName;

  /// Shown under the name in list rows (a company/title, or the phone
  /// number when no title is set).
  String subtitle;
  String phone;
  String email;
  String notes;

  String get fullName => '$firstName $lastName'.trim();

  String get initials {
    final f = firstName.isNotEmpty ? firstName[0] : '';
    final l = lastName.isNotEmpty ? lastName[0] : '';
    return ('$f$l').toUpperCase();
  }

  String get sortLetter =>
      firstName.isNotEmpty ? firstName[0].toUpperCase() : '#';
}
