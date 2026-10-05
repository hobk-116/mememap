"""Compatibility imports; moderation services now live in mememap.moderation."""
from mememap.moderation import (ModerationService, bounded_text, restriction,
                                report_deleted_pin, record_audit)
from mememap.migrations import moderation_schema as initialize_moderation
