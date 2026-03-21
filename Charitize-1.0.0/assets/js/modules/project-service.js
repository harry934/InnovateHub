// import { supabase } from '../core/supabase-config.js'; (Loaded as global script in dashboard.html)
import SupabaseService from '../core/supabase-service.js';

export const ProjectService = {
    submitProject: async (formData, file) => {
        const client = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        if (!client) throw new Error("Supabase client is not initialized.");
        
        const { data: { user } } = await client.auth.getUser();
        if (!user) throw new Error("No authenticated user found.");

        let projectData = {
            innovator_id: user.id,
            title: formData.title,
            problem_statement: formData.problemStatement,
            proposed_solution: formData.proposedSolution,
            objectives: formData.objectives,
            expected_impact: formData.expectedImpact,
            target_area: formData.targetArea || (formData.categories && formData.categories[0]) || 'General',
            status: 'pending'
        };

        try {
            const { data: sbProject, error: projectError } = await client
                .from('projects')
                .insert([projectData])
                .select()
                .single();

            if (projectError) throw projectError;
            if (!sbProject) throw new Error("Failed to create project record.");

            console.log("Supabase Project Created ✓", sbProject.id);
            
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${sbProject.id}-${Date.now()}.${fileExt}`;
                const filePath = `documents/${user.id}/${fileName}`;

                const { error: uploadError } = await client.storage
                    .from('public-assets')
                    .upload(filePath, file);

                if (!uploadError) {
                    const { data: { publicUrl } } = client.storage
                        .from('public-assets')
                        .getPublicUrl(filePath);

                    await client
                        .from('projects')
                        .update({ document_url: publicUrl })
                        .eq('id', sbProject.id);
                        
                    console.log("Project Document Uploaded ✓", publicUrl);
                } else {
                    console.warn("Document upload failed, but project record created:", uploadError);
                }
            }

            return sbProject;
        } catch (error) {
            console.error("ProjectService Error:", error);
            throw error;
        }
    }
};

export default ProjectService;
