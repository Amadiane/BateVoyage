from rest_framework import serializers
from .models import ModeleDocument


class ModeleDocumentSerializer(serializers.ModelSerializer):
    type_document_display = serializers.CharField(source="get_type_document_display", read_only=True)

    class Meta:
        model = ModeleDocument
        fields = "__all__"