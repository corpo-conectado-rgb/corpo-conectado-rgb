const mockData = {
    user: {
        name: "Kevin Oliveira",
        splitType: "A, B, C",
        totalDays: 3,
        objective: "Hipertrofia"
    },
    workouts: {
        "A": {
            id: "A",
            title: "Treino A - Segunda",
            focus: "Peito, Ombros e Tríceps",
            exercises: [
                { 
                    id: 1, 
                    name: "Supino Reto com Barra", 
                    muscleGroup: "Peito", 
                    sets: 4, 
                    reps: "8-10", 
                    notes: "Manter as escápulas retraídas.", 
                    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw" 
                },
                { 
                    id: 2, 
                    name: "Desenvolvimento com Halteres", 
                    muscleGroup: "Ombros", 
                    sets: 3, 
                    reps: "10-12", 
                    notes: "Não bater os halteres no topo e focar na contração.", 
                    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw" 
                },
                { 
                    id: 3, 
                    name: "Tríceps Pulley", 
                    muscleGroup: "Tríceps", 
                    sets: 3, 
                    reps: "12-15", 
                    notes: "Cotovelos estabilizados no corpo.", 
                    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw" 
                }
            ]
        },
        "B": {
            id: "B",
            title: "Treino B - Quarta",
            focus: "Costas, Bíceps e Abdômen",
            exercises: [
                { 
                    id: 4, 
                    name: "Puxada Frontal", 
                    muscleGroup: "Costas", 
                    sets: 4, 
                    reps: "8-12", 
                    notes: "Puxar na direção do peito ativando as dorsais.", 
                    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw" 
                },
                { 
                    id: 5, 
                    name: "Rosca Direta", 
                    muscleGroup: "Bíceps", 
                    sets: 3, 
                    reps: "10-12", 
                    notes: "Movimento controlado na descida.", 
                    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw" 
                }
            ]
        },
        "C": {
            id: "C",
            title: "Treino C - Sexta",
            focus: "Pernas e Panturrilhas",
            exercises: [
                { 
                    id: 6, 
                    name: "Agachamento Livre", 
                    muscleGroup: "Pernas", 
                    sets: 4, 
                    reps: "8-10", 
                    notes: "Descer até passar de 90 graus mantendo a coluna estável.", 
                    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw" 
                },
                { 
                    id: 7, 
                    name: "Leg Press 45º", 
                    muscleGroup: "Pernas", 
                    sets: 3, 
                    reps: "10-12", 
                    notes: "Não estender o joelho completamente durante o topo.", 
                    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw" 
                }
            ]
        }
    }
};
