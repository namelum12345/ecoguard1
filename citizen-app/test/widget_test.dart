import 'package:flutter_test/flutter_test.dart';
import 'package:citizen_app/app.dart';

void main() {
  testWidgets('App builds without error', (WidgetTester tester) async {
    await tester.pumpWidget(const EcoGuardApp());
  });
}
