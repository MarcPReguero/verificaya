
import * as React from "react";
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Button,
    Hr,
} from "@react-email/components";

interface ScreeningCompletedEmailProps {
    landlordName: string;
    tenantName: string;
    score: number;
    reportUrl: string;
    documentId: string;
}

export default function ScreeningCompletedEmail({
    landlordName = "Propietario",
    tenantName = "Inquilino Ejemplo",
    score = 85,
    reportUrl = "#",
    documentId = "12345",
}: ScreeningCompletedEmailProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return "#22c55e"; // green
        if (score >= 60) return "#eab308"; // yellow
        return "#ef4444"; // red
    };

    const getRecommendation = (score: number) => {
        if (score >= 80) return "APROBADO ✅";
        if (score >= 60) return "CON RESERVAS ⚠️";
        return "NO RECOMENDADO ❌";
    };

    return (
        <Html>
            <Head />
            <Preview>Informe de Solvencia: {tenantName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={brand}>VerificaYa</Heading>
                    </Section>

                    <Section style={content}>
                        <Heading as="h2" style={h2}>
                            Verificación Completada
                        </Heading>
                        <Text style={text}>Hola {landlordName},</Text>
                        <Text style={text}>
                            El análisis de solvencia para <strong>{tenantName}</strong> ha finalizado.
                        </Text>

                        {/* Score Card */}
                        <Section style={scoreCard}>
                            <Text style={scoreTitle}>PUNTUACIÓN OBTENIDA</Text>
                            <Heading as="h1" style={{ ...scoreNumber, color: getScoreColor(score) }}>
                                {score}/100
                            </Heading>
                            <Text style={{ ...scoreResult, color: getScoreColor(score) }}>
                                {getRecommendation(score)}
                            </Text>
                        </Section>

                        <Text style={text}>
                            Hemos analizado la documentación aportada, historial laboral y solvencia estimada.
                        </Text>

                        {/* CTA */}
                        <Section style={btnContainer}>
                            <Button href={reportUrl} style={button}>
                                Ver Informe Completo
                            </Button>
                        </Section>

                        <Text style={smallText}>
                            ID de referencia: {documentId}
                        </Text>

                        <Hr style={hr} />

                        <Text style={footer}>
                            © 2025 VerificaYa. Todos los derechos reservados.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Styles
const main = {
    backgroundColor: "#f6f9fc",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    maxWidth: "600px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
};

const header = {
    padding: "32px",
    textAlign: "center" as const,
    backgroundColor: "#1e40af", // blue-800
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
};

const brand = {
    color: "#ffffff",
    margin: "0",
    fontSize: "24px",
    fontWeight: "bold",
    letterSpacing: "-0.5px",
};

const content = {
    padding: "0 48px",
};

const h2 = {
    fontSize: "24px",
    margin: "30px 0",
    textAlign: "center" as const,
    color: "#1f2937",
};

const text = {
    color: "#4b5563",
    fontSize: "16px",
    lineHeight: "24px",
    textAlign: "left" as const,
};

const scoreCard = {
    padding: "24px",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    textAlign: "center" as const,
    margin: "32px 0",
    border: "1px solid #e5e7eb",
};

const scoreTitle = {
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",
    marginBottom: "8px",
};

const scoreNumber = {
    fontSize: "48px",
    margin: "0",
    fontWeight: "800",
};

const scoreResult = {
    fontSize: "18px",
    fontWeight: "600",
    margin: "8px 0 0",
};

const btnContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#2563eb", // blue-600
    borderRadius: "6px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 32px",
    boxShadow: "0 4px 6px rgba(37, 99, 235, 0.2)",
};

const hr = {
    borderColor: "#e6ebf1",
    margin: "32px 0",
};

const smallText = {
    color: "#9ca3af",
    fontSize: "14px",
};

const footer = {
    color: "#8898aa",
    fontSize: "12px",
    textAlign: "center" as const,
};
