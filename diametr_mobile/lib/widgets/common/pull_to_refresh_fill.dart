import 'package:flutter/material.dart';

/// Lets a non-scrolling child (typically an [EmptyState]) sit inside a
/// [RefreshIndicator]: it fills and stays centred in the available height
/// exactly as before, but the area can now be pulled down to refresh.
/// Needs a bounded height from its parent (Scaffold body, Expanded, ...).
class PullToRefreshFill extends StatelessWidget {
  final Widget child;
  const PullToRefreshFill({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          width: constraints.maxWidth,
          height: constraints.maxHeight.isFinite ? constraints.maxHeight : null,
          child: child,
        ),
      ),
    );
  }
}
