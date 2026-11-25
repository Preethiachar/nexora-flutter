import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexora_mobile/main.dart';

void main() {
  testWidgets('Nexora app builds smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: NexoraApp()));
    expect(find.byType(NexoraApp), findsOneWidget);
  });
}
