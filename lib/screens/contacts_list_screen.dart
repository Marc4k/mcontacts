import 'package:flutter/material.dart';

import '../models/contact.dart';
import '../state/contacts_store.dart';
import '../theme/app_theme.dart';
import '../widgets/contact_row.dart';
import 'contact_detail_screen.dart';

const _kAlphabet = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

class ContactsListScreen extends StatefulWidget {
  const ContactsListScreen({super.key});

  @override
  State<ContactsListScreen> createState() => _ContactsListScreenState();
}

class _ContactsListScreenState extends State<ContactsListScreen> {
  final _sectionKeys = <String, GlobalKey>{};
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _scrollToLetter(String letter) {
    final key = _sectionKeys[letter];
    final ctx = key?.currentContext;
    if (ctx == null) return;
    Scrollable.ensureVisible(
      ctx,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final store = ContactsScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final allContacts = [...store.contacts]
          ..sort((a, b) =>
              a.fullName.toLowerCase().compareTo(b.fullName.toLowerCase()));

        final query = _searchController.text.trim();
        final isSearching = query.isNotEmpty;
        final results = isSearching ? store.search(query) : const <Contact>[];

        return Scaffold(
          body: SafeArea(
            child: Column(
              children: [
                _buildHeader(context, allContacts.length),
                Expanded(
                  child: isSearching
                      ? _SearchResults(query: query, results: results)
                      : _AlphabetList(
                          contacts: allContacts,
                          sectionKeys: _sectionKeys,
                          onScrollToLetter: _scrollToLetter,
                        ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(BuildContext context, int count) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(26, 10, 26, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$count people',
            style: AppText.sans(
              size: 11,
              weight: FontWeight.w400,
              color: AppColors.accent,
              letterSpacing: 2.2,
            ),
          ),
          Text('Contacts', style: AppText.serifHeading(size: 58)),
          const SizedBox(height: 18),
          _SearchBar(controller: _searchController),
        ],
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.surfaceBorder),
      ),
      child: Row(
        children: [
          Icon(Icons.search, size: 18, color: AppColors.textMuted),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: controller,
              cursorColor: AppColors.accent,
              style: AppText.sans(size: 15),
              decoration: InputDecoration(
                isDense: true,
                border: InputBorder.none,
                hintText: 'Search',
                hintStyle: AppText.sans(size: 15, color: AppColors.textMuted),
              ),
            ),
          ),
          if (controller.text.isNotEmpty)
            GestureDetector(
              onTap: controller.clear,
              child: Icon(Icons.close, size: 16, color: AppColors.textMuted),
            ),
        ],
      ),
    );
  }
}

class _SearchResults extends StatelessWidget {
  const _SearchResults({required this.query, required this.results});

  final String query;
  final List<Contact> results;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(30, 4, 30, 24),
      children: [
        Text(
          '${results.length} result${results.length == 1 ? '' : 's'}',
          style: AppText.sans(
            size: 11,
            weight: FontWeight.w600,
            color: AppColors.textFaint,
            letterSpacing: 1.6,
          ),
        ),
        const SizedBox(height: 4),
        for (var i = 0; i < results.length; i++) ...[
          ContactRow(
            contact: results[i],
            highlightQuery: query,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ContactDetailScreen(contactId: results[i].id),
              ),
            ),
          ),
          if (i != results.length - 1) const ContactRowDivider(),
        ],
        if (results.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text('No matches', style: AppText.sans(color: AppColors.textMuted)),
          ),
      ],
    );
  }
}

class _AlphabetList extends StatelessWidget {
  const _AlphabetList({
    required this.contacts,
    required this.sectionKeys,
    required this.onScrollToLetter,
  });

  final List<Contact> contacts;
  final Map<String, GlobalKey> sectionKeys;
  final ValueChanged<String> onScrollToLetter;

  @override
  Widget build(BuildContext context) {
    final byLetter = <String, List<Contact>>{};
    for (final c in contacts) {
      byLetter.putIfAbsent(c.sortLetter, () => []).add(c);
    }
    final availableLetters = byLetter.keys.toSet();
    sectionKeys
      ..removeWhere((k, _) => !availableLetters.contains(k))
      ..addEntries(availableLetters
          .where((l) => !sectionKeys.containsKey(l))
          .map((l) => MapEntry(l, GlobalKey())));

    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            for (final letter in _kAlphabet)
              if (byLetter.containsKey(letter))
                SliverToBoxAdapter(
                  child: _LetterSection(
                    key: sectionKeys[letter],
                    letter: letter,
                    contacts: byLetter[letter]!,
                    onTapContact: (c) => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ContactDetailScreen(contactId: c.id),
                      ),
                    ),
                  ),
                ),
            const SliverToBoxAdapter(child: SizedBox(height: 32)),
          ],
        ),
        Positioned(
          right: 6,
          top: 0,
          bottom: 0,
          child: _AlphabetIndex(
            available: availableLetters,
            onSelect: onScrollToLetter,
          ),
        ),
      ],
    );
  }
}

class _LetterSection extends StatelessWidget {
  const _LetterSection({
    super.key,
    required this.letter,
    required this.contacts,
    required this.onTapContact,
  });

  final String letter;
  final List<Contact> contacts;
  final ValueChanged<Contact> onTapContact;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(30, 6, 46, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: Text(
              letter,
              style: AppText.serifLabel(size: 26, color: AppColors.accent)
                  .copyWith(fontStyle: FontStyle.italic),
            ),
          ),
          for (var i = 0; i < contacts.length; i++) ...[
            ContactRow(contact: contacts[i], onTap: () => onTapContact(contacts[i])),
            if (i != contacts.length - 1) const ContactRowDivider(),
          ],
        ],
      ),
    );
  }
}

class _AlphabetIndex extends StatelessWidget {
  const _AlphabetIndex({required this.available, required this.onSelect});

  final Set<String> available;
  final ValueChanged<String> onSelect;

  void _handlePosition(BuildContext context, Offset globalPosition) {
    final box = context.findRenderObject() as RenderBox?;
    if (box == null) return;
    final local = box.globalToLocal(globalPosition);
    final index = (local.dy / box.size.height * _kAlphabet.length)
        .clamp(0, _kAlphabet.length - 1)
        .floor();
    final letter = _kAlphabet[index];
    if (available.contains(letter)) onSelect(letter);
  }

  @override
  Widget build(BuildContext context) {
    return Builder(builder: (context) {
      return GestureDetector(
        behavior: HitTestBehavior.translucent,
        onVerticalDragUpdate: (d) => _handlePosition(context, d.globalPosition),
        onTapUp: (d) => _handlePosition(context, d.globalPosition),
        child: Container(
          width: 20,
          alignment: Alignment.center,
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (final letter in _kAlphabet)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 1.2),
                    child: Text(
                      available.contains(letter) ? letter : '·',
                      style: AppText.sans(
                        size: 9,
                        weight: FontWeight.w600,
                        color: available.contains(letter)
                            ? AppColors.textFaint
                            : AppColors.textFaint.withValues(alpha: 0.4),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
    });
  }
}
