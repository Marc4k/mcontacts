import 'package:flutter/material.dart';

import 'screens/contacts_list_screen.dart';
import 'state/contacts_store.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const MContactApp());
}

class MContactApp extends StatefulWidget {
  const MContactApp({super.key});

  @override
  State<MContactApp> createState() => _MContactAppState();
}

class _MContactAppState extends State<MContactApp> {
  final _store = ContactsStore();

  @override
  Widget build(BuildContext context) {
    return ContactsScope(
      store: _store,
      child: MaterialApp(
        title: 'Contacts',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: const ContactsListScreen(),
      ),
    );
  }
}
