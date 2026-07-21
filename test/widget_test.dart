import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mcontact/main.dart';

void main() {
  testWidgets('Contacts app launches to the contacts list', (tester) async {
    await tester.pumpWidget(const MContactApp());
    await tester.pumpAndSettle();

    expect(find.text('Ava Thornton'), findsOneWidget);
    expect(find.text('Search'), findsWidgets);
  });

  testWidgets('Tapping a contact opens its detail screen', (tester) async {
    await tester.pumpWidget(const MContactApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Ava Thornton'));
    await tester.pumpAndSettle();

    expect(find.text('Product designer · Figma'), findsOneWidget);
    expect(find.text('Call'), findsOneWidget);
  });

  testWidgets('Typing in the search bar filters the current list in place',
      (tester) async {
    await tester.pumpWidget(const MContactApp());
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'vidal');
    await tester.pumpAndSettle();

    expect(find.text('Marco Vidal'), findsOneWidget);
    expect(find.text('Ava Thornton'), findsNothing);
    expect(find.text('1 result'), findsOneWidget);
  });
}
